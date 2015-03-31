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

(function () {

    "use strict";

    var fs = require('fs');
    var mkdirp = require("mkdirp");
    var jst = require("jstranspiler");
    var nodefn = require("when/node");
    var path = require("path");

    var args = jst.args(process.argv);
    var promised = {
        mkdirp: nodefn.lift(mkdirp),
        readFile: nodefn.lift(fs.readFile),
        writeFile: nodefn.lift(fs.writeFile)
    };

    function createCompilerSettings(options) {
        var compSettings = new TypeScript.CompilationSettings();

        compSettings.mapSourceFiles = options.sourceMap;
        compSettings.sourceRoot = options.sourceRoot;
        compSettings.mapRoot = options.mapRoot;

        if (options.moduleKind.toLowerCase() == "amd") {
            compSettings.moduleGenTarget = 2;
        } else if (options.moduleKind.toLowerCase() == "commonjs") {
            compSettings.moduleGenTarget = 1;
        }

        if (options.target.toLowerCase() == "es3") {
            compSettings.codeGenTarget = 0;
        } else if (options.target.toLowerCase() == "es5") {
            compSettings.codeGenTarget = 1;
        }

        compSettings.outFileOption = options.outFile;
        compSettings.outDirOption = options.outDir;
        compSettings.removeComments = options.removeComments;

        return TypeScript.ImmutableCompilationSettings.fromCompilationSettings(compSettings);
    }

    function compile(src, input, compilationContext) {
        var opt = args.options;
        //compilationResult contains the compiled source and the dependencies
        var compilationResult = { source: '', deps: []};
        var compiler = new TypeScript.TypeScriptCompiler(new TypeScript.NullLogger(), createCompilerSettings(opt));

        if (src.length === 0) {
            return compilationResult;
        }

        //Add the base definitions library as a source file
        var fl = TypeScript.ScriptSnapshot.fromString(libdts);
        compiler.addFile('lib.d.ts', fl, TypeScript.ByteOrderMark.None, 0, false, []);

        //Holds the work units
        var sourceUnitsToParse = [
            { content: src, path: input }
        ];
        var parsedUnits = {};

        var recordDiagnostic = function (d, path, content) {
            var lineMap = d.lineMap();
            var lineCol = { line: -1, character: -1 };
            lineMap.fillLineAndCharacterFromPosition(d.start(), lineCol);
            var problem = {
                line: d.line() + 1,
                col: d.character(),
                message: d.message(),
                compilationUnitIndex: 0,
                path: path,
                content: content
            };
            compilationContext.addError(problem);
        };


        //Walk over all the source units, adding references to the end
        while (sourceUnitsToParse.length > 0) {
            /*jshint -W083 */
            var sourceToParse = sourceUnitsToParse.shift();

            parsedUnits[sourceToParse.path] = sourceToParse.content;

            var code = TypeScript.ScriptSnapshot.fromString(sourceToParse.content);

            var preProc = TypeScript.preProcessFile(sourceToParse.path, code, true);
            var fileReferencesInSource = [].concat(preProc.referencedFiles);
            preProc.importedFiles.forEach(function(ref) {
                ref.path = ref.path + ".ts";
                fileReferencesInSource.push(ref);
            });


            fileReferencesInSource.forEach(function(t){compilationResult.deps.push(t); });

            //Use our context to resolve the dependencies/references
            var referencedSourceUnits = compilationContext.resolveFiles(fileReferencesInSource, sourceToParse);

            //Add the source file to the compiler with the list of its references
            compiler.addFile(sourceToParse.path, code, TypeScript.ByteOrderMark.None, 0, false, referencedSourceUnits);

            //Parse the source file
            var syntacticDiagnostics = compiler.getSyntacticDiagnostics(sourceToParse.path);
            syntacticDiagnostics.forEach(function (element) {
                recordDiagnostic(element, sourceToParse.path, sourceToParse.content);
            });

            //Add the references to the "to parse" list
            for (var i = 0; i < referencedSourceUnits.length; i++) {
                var sourceUnit = referencedSourceUnits[i];
                //... if we haven't parsed it yet
                if (!parsedUnits[sourceUnit.path]) {
                    sourceUnitsToParse.push(sourceUnit);
                }
            }
        }

        //Now that we've parsed all the files, we can do the semantic analysis and code emission
        var files = compiler.fileNames();
        files.forEach(function (file) {
            var semanticDiagnostics = compiler.getSemanticDiagnostics(file);
            semanticDiagnostics.forEach(function (element) {
                recordDiagnostic(element, file, fs.readFileSync(file).toString());
            });
        });

        var emitOutput = compiler.emitAll(compilationContext.basePath);
        emitOutput.outputFiles.forEach(function (f) {
            if (f.name.slice(0, -3) === input.slice(0, -3)) {
                compilationResult.source += f.text;
            }
        });

        return compilationResult;
    }

    var compilationContext = {
        errors : [],
        addError : function(err) {
            this.errors.push(err);
        },

        resolveFiles : function(refs, source) {
            //TODO: fix me
            var rels = [];
            var parentDir = path.dirname(source.path);
            refs.forEach(function(ref) {
                var newPath = path.resolve(parentDir, ref.path);
                var newRef = { path: newPath, content: ""};

                try {
                    newRef.content = fs.readFileSync(newPath).toString();
                } catch (e) {
                    newRef.content = "";
                }
                rels.push(newRef);
            });
            return rels;
        },
        basePath : "/"
    };

    function processor(input, output) {
        return promised.readFile(input, "utf8").then(function (contents) {
            var options = args.options;
            options.filename = input;

            var result = compile(contents, input, compilationContext);

            if (compilationContext.errors.length > 0) {
                //Unfortunately we can only show the first error in the file
                throw parseError(input, contents, compilationContext.errors[0]);
            }

            return result;
        }).then(function (result) {
            return promised.mkdirp(path.dirname(output)).yield(result);
        }).then(function (result) {
            return promised.writeFile(output, result.source, "utf8").yield(result);
        }).then(function (result) {
            //Extract the paths from the deps references
            var deps = [];
            result.deps.forEach(function(ref) {
                deps.push(ref.path);
            });

            return {
                source: input,
                result: {
                    filesRead: [input].concat(deps),
                    filesWritten: [output]
                }
            };
        }).catch(function (e) {
            if (jst.isProblem(e)) {
                return e;
            } else {
                throw e;
            }
        });

    }

    function parseError(input, contents, error) {
        var lines = error.content.split("\n", error.line);
        error.content = "";
        var lineNumber = error.line;
        return {
            message: error.message,
            severity: "error",
            lineNumber: lineNumber,
            characterOffset: error.col,
            lineContent: (lineNumber > 0 && lines.length >= lineNumber ? lines[lineNumber - 1] : "Unknown line"),
            source: error.path
        };
    }

    jst.process({processor: processor, inExt: ".ts", outExt: ".js"}, args);
})();
