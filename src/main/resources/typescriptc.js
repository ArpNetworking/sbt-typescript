/*
 * Copyright 2014 Groupon.com
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

class Logger {
    constructor(logLevel) {
        this.logLevel = logLevel;
    }

    debug(message) {
        if (this.logLevel === 'debug') {
            console.log(message);
        }
    }

    info(message) {
        if (this.logLevel === 'debug' || this.logLevel === 'info') {
            console.log(message);
        }
    }

    warn(message) {
        if (this.logLevel === 'debug' || this.logLevel === 'info' || this.logLevel === 'warn') {
            console.log(message);
        }
    }

    error(message, error) {
        if (this.logLevel === 'debug' || this.logLevel === 'info' || this.logLevel === 'warn' || this.logLevel === 'error') {
            if (error !== undefined) {
                var errorMessage = error.message;
                if (error.fileName !== undefined) {
                    errorMessage = errorMessage + " in " + error.fileName;
                }
                if (error.lineNumber !== undefined) {
                    errorMessage = errorMessage + " at line " + error.lineNumber;
                }
                console.log(message + " " + errorMessage);
            } else {
                console.log(message);
            }
        }
    }
}

/* global process, require */
(() => {

    "use strict";

    const fs = require('fs');
    const jst = require("jstranspiler");
    const typescript = require("typescript");
    const path = require("path");
    const args = jst.args(process.argv);
    const logger = new Logger(args.options.logLevel);
    const problemSeverities = ['warn', 'error', 'info'];

    logger.debug("args=" + JSON.stringify(args));

    let getTSConfig = (options) => {
        let configFilePath = path.join(options.projectBase, options.configFile);
        let configJson = JSON.parse(fs.readFileSync(configFilePath, 'utf-8'));
        let configDir = path.dirname(configFilePath);
        let configFileName = path.basename(configFilePath);

        return typescript.parseJsonConfigFileContent(
            configJson, typescript.sys, configDir, {}, configFileName
        );
    };

    let createCompilerSettings = (args) => {
        logger.debug("creating compiler settings");
        let config = getTSConfig(args.options);
        let compSettings = config.options;

        compSettings.rootDir = args.options.rootDir;
        compSettings.baseUrl = args.options.baseUrl;
        compSettings.outDir = args.target;
        compSettings.sourceRoot = args.options.sourceRoot;

        return compSettings;
    };

    let replaceFileExtension = (file, ext) => {
        var oldExt = path.extname(file);
        return file.substring(0, file.length - oldExt.length) + ext;
    };

    let fixSourceMapFile = (file) => {
        /*
         All source .ts files are copied to public folder and reside there side by side with generated .js and js.map files.
         It means that source maps root at runtime is always '.' and 'sources' array should contain only file name.
         */
        let sourceMap = JSON.parse(fs.readFileSync(file, 'utf-8'));
        sourceMap.sources = sourceMap.sources.map((source) => path.basename(source));

        fs.writeFileSync(file, JSON.stringify(sourceMap), 'utf-8');
    };

    let prepareMessageText = (diagnostic) => {
        let messageText = diagnostic.messageText;

        // Sometimes the messageText is more than a string
        // In this case, we need to walk the "next" objects and build
        // the proper message text
        if (typeof diagnostic.messageText === "object") {
            messageText = "";
            let recurse = diagnostic.messageText;
            while (recurse !== undefined) {
                messageText += recurse.messageText + "\n";
                recurse = recurse.next;
            }
            messageText = messageText.substring(0, messageText.length - 1);
        }

        return messageText;
    };

    let createProblem = (diagnostic, lineCol = {line: 0, character: 0}, fileName = 'Global', lineText = '') => {
        logger.debug("recording diagnostic");
        let diagnosticFile = diagnostic.file;
        if (diagnosticFile) {
            lineCol = diagnosticFile.getLineAndCharacterOfPosition(diagnostic.start);
            let lineStart = diagnosticFile.getLineStarts()[lineCol.line];
            let lineEnd = diagnosticFile.getLineStarts()[lineCol.line + 1];
            lineText = diagnosticFile.text.substring(lineStart, lineEnd);
            fileName = diagnosticFile.fileName;
        }

        return {
            lineNumber: lineCol.line + 1,
            characterOffset: lineCol.character,
            message: prepareMessageText(diagnostic),
            source: fileName,
            severity: problemSeverities[diagnostic.category],
            lineContent: lineText
        };
    };

    let createFilesWrittenArray = (outputFile, compilerSettings) => {
        let filesWritten = [];

        let outputFileMap = outputFile + ".map";

        filesWritten.push(outputFile);
        if (compilerSettings.declaration) {
            let outputFileDeclaration = replaceFileExtension(outputFile, ".d.ts");
            filesWritten.push(outputFileDeclaration);
        }

        if (compilerSettings.sourceMap) {
            if (!args.options.sourceRoot) {
                fixSourceMapFile(outputFileMap);
            }

            filesWritten.push(outputFileMap);
        }

        return filesWritten;
    };

    let findDependencies = (sourceFile) => {
        let depFiles = sourceFile.referencedFiles;
        let deps = [sourceFile.fileName];

        if (depFiles !== undefined && depFiles.length > 0) {
            deps.concat(depFiles.map((dep) => dep.fileName));
        }

        return deps;
    };

    let getResults = (sourceFiles, compilerSettings, inputFiles, outputFiles) => {
        let filesWrittenForSingleFile = [];
        if (compilerSettings.outFile) {
            filesWrittenForSingleFile = createFilesWrittenArray(compilerSettings.outFile, compilerSettings);
        }

        let createResult = (sourceFile) => {
            logger.debug("examining " + sourceFile.fileName);
            let index = inputFiles.indexOf(path.normalize(sourceFile.fileName));
            let outputFile = outputFiles[index];
            let filesWritten = (compilerSettings.outFile) ? filesWrittenForSingleFile : createFilesWrittenArray(outputFile, compilerSettings);

            return {
                source: sourceFile.fileName,
                result: {
                    filesRead: findDependencies(sourceFile),
                    filesWritten: filesWritten
                }
            };
        };

        return sourceFiles.map(createResult);
    };

    let getRelativePath = (base, fileName) => {
        return fileName.replace(base, '');
    };

    let getProgramDiagnostics = (program, emitOutput) => {
        let diagnostics = program.getSyntacticDiagnostics();
        if (diagnostics.length === 0) {
            diagnostics = program.getGlobalDiagnostics();
            if (diagnostics.length === 0) {
                diagnostics = program.getSemanticDiagnostics();
            }
        }

        return diagnostics.concat(emitOutput.diagnostics);
    };

    let createCompiler = (sources, compilerSettings) => {
        logger.debug("createProgram with  " + sources);
        return typescript.createProgram(sources, compilerSettings, typescript.createCompilerHost(compilerSettings));
    };

    let getOutputFileName = (compilerSettings, fileName) => {
        let relativeFilePath = getRelativePath(compilerSettings.rootDir, fileName);

        return path.join(compilerSettings.outDir, replaceFileExtension(path.normalize(relativeFilePath), ".js"));
    };

    function compile(args) {
        let compilerSettings = createCompilerSettings(args);
        logger.debug("compilerSettings = " + JSON.stringify(compilerSettings));

        let compiler = createCompiler(args.options.sources, compilerSettings);
        let compilerOutput = compiler.emit();

        let diagnostics = getProgramDiagnostics(compiler, compilerOutput);

        let inputFiles = args.sourceFileMappings.map((pair) => pair[0]);
        let outputFiles = inputFiles.map((fileName) => getOutputFileName(compilerSettings, fileName));

        let sourceFiles = compiler.getSourceFiles()
            .filter((sourceFile) => inputFiles.includes(path.normalize(sourceFile.fileName)));

        return {
            results: getResults(sourceFiles, compilerSettings, inputFiles, outputFiles),
            problems: diagnostics.map(createProblem)
        };
    }

    console.log("\u0010" + JSON.stringify(compile(args)));
})();
