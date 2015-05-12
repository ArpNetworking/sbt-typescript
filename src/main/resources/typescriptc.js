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

/* global process, require */

(function () {

    "use strict";

    var fs = require('fs');
    var mkdirp = require("mkdirp");
    var jst = require("jstranspiler");
    var typescript = require("typescript");
    var when = require("when");
    var path = require("path");

    var args = jst.args(process.argv);
    var logger = makeLogger(args.options.logLevel);
    logger.debug("starting compile");
    logger.debug("args=" + JSON.stringify(args));

    function makeLogger (logLevel) {
        var that = {};
        that.debug = function (message) {
            if (logLevel === 'debug') {
                console.log(message);
            }
        };

        that.info = function (message) {
            if (logLevel === 'debug' || logLevel === 'info') {
                console.log(message);
            }
        };

        that.warn = function (message) {
            if (logLevel === 'debug' || logLevel === 'info' || logLevel === 'warn') {
                console.log(message);
            }
        };

        that.error = function (message, error) {
            if (logLevel === 'debug' || logLevel === 'info' || logLevel === 'warn' || logLevel === 'error') {
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
        };

        return that;
    }

    function createCompilerSettings(options) {
        logger.debug("creating compiler settings");
        var compSettings = new typescript.getDefaultCompilerOptions();
        logger.debug("instantiated");

        compSettings.sourceMap = options.sourceMap;
        compSettings.sourceRoot = options.sourceRoot;
        compSettings.mapRoot = options.mapRoot;

        if (options.moduleKind.toLowerCase() == "amd") {
            compSettings.module = 2;
        } else if (options.moduleKind.toLowerCase() == "commonjs") {
            compSettings.module = 1;
        }

        if (options.target.toLowerCase() == "es3") {
            compSettings.codeGenTarget = 0;
        } else if (options.target.toLowerCase() == "es5") {
            compSettings.codeGenTarget = 1;
        } else if (options.target.toLowerCase() == "es6") {
            compSettings.codeGenTarget = 2;
        }

        compSettings.out = options.outFile;
        compSettings.outDir = options.outDir;
        compSettings.removeComments = options.removeComments;
        compSettings.rootDir = options.rootDir;
        logger.debug("settings created");

        return compSettings;
    }

    function compile(args) {
        var sourceMaps = args.sourceFileMappings;
        var inputFiles = [];
        var compilerOutputFiles = [];
        var outputFiles = [];
        var rootDir = "";
        sourceMaps.forEach(function(map) {
            inputFiles.push(map[0]);
            var targetOutput = map[1].replace(/\.[^/.]+$/, "") + ".js";
            outputFiles.push(path.join(args.target, targetOutput));

            var compilerOutput = map[0].replace(/\.[^/.]+$/, "") + ".js";
            compilerOutputFiles.push(compilerOutput);
            rootDir = map[0].substring(0, map[0].length - map[1].length);
        });

        logger.debug("starting compilation of " + inputFiles);
        var opt = args.options;
        opt.rootDir = rootDir;
        opt.outDir = args.target;
        //compilationResult contains the compiled source and the dependencies
        var options = createCompilerSettings(opt);
        logger.debug("options = " + JSON.stringify(options));
        var compilerHost = typescript.createCompilerHost(options);
        var program = typescript.createProgram(inputFiles, options, compilerHost);

        var output = {results: [], problems: []};


        var recordDiagnostic = function (d) {
            logger.debug("recording diagnostic");
            var lineCol = {line: 0, character: 0};
            var fileName = "Global";
            var lineText = "";
            if (d.file) {
                lineCol = d.file.getLineAndCharacterOfPosition(d.start);

                var lineStart = d.file.getLineStarts()[lineCol.line];
                var lineEnd = d.file.getLineStarts()[lineCol.line + 1];
                lineText = d.file.text.substring(lineStart, lineEnd);
                fileName = d.file.fileName;
            }

            var sev = "error";
            if (d.category === 0) {
                sev = "warn";
            } else if (d.category === 2) {
                sev = "info";
            }
            var problem = {
                lineNumber: lineCol.line,
                characterOffset: lineCol.character,
                message: d.messageText,
                source: fileName,
                severity: sev,
                lineContent: lineText
            };
            logger.debug("diagnostic recorded");
            output.problems.push(problem);
        };

        var recordDiagnostics = function(diagnostics) {
            diagnostics.forEach(function(diagnostic) {
                recordDiagnostic(diagnostic);
            });
        };

        logger.debug("compiler created");

        logger.debug("looking for global diagnostics");
        var diagnostics = program.getSyntacticDiagnostics();
        recordDiagnostics(diagnostics);
        if (diagnostics.length === 0) {
            diagnostics = program.getGlobalDiagnostics();
            recordDiagnostics(diagnostics);
            if (diagnostics.length === 0) {
                diagnostics = program.getSemanticDiagnostics();
                recordDiagnostics(diagnostics);
            }
        }

        var emitOutput = program.emit();
        recordDiagnostics(emitOutput.diagnostics);

        var sourceFiles = program.getSourceFiles();
        logger.debug("got some source files");
        sourceFiles.forEach(function (sourceFile) {
            var index = inputFiles.indexOf(sourceFile.fileName);
            if (index === -1) {
                logger.debug("did not find source file " + sourceFile.fileName + " in list compile list, assuming library or dependency and skipping output");
                return;
            }
            logger.debug("examining " + sourceFile.fileName);
            logger.debug("looking for deps");
            var depFiles = sourceFile.referencedFiles;

            var file = sourceFile.fileName;
            var deps = [sourceFile.fileName];

            if (depFiles !== undefined) {
                logger.debug("got some deps: " + depFiles);
                depFiles.forEach(function (dep) {
                    logger.debug("found referenced file " + dep.fileName);
                    deps.push(dep.fileName);
                });
            }

            var result = {source: file, result: {filesRead: deps, filesWritten: [outputFiles[index]]}};
            output.results.push(result);
        });
        logger.debug("output=" + JSON.stringify(output));
        return output;
    }

    console.log("\u0010" + JSON.stringify(compile(args)));
})();
