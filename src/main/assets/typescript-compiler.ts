///<reference path="logger.ts"/>
///<reference path="types/node.d.ts"/>
///<reference path="types/sbt-web.d.ts"/>
///<reference path="types/sbt-ts.d.ts"/>
///<reference path="types/ts.d.ts"/>

namespace sbtts {
  export class TypescriptCompiler {
    private problemSeverities: sbtweb.Severity[] = ['warn', 'error', 'info'];
    private logger: sbtts.Logger;

    constructor(private fs: node.fs,
                private path: node.path,
                private typescript: ts.TypescriptApi,
                private args: sbtweb.Arguments<sbtts.Options>) {
      this.logger = new sbtts.Logger(args.options.logLevel);
      this.logger.debug(`args = ${JSON.stringify(args)}`);
    }

    private getTSConfig(options: sbtts.Options, existingOpts: any): ts.ParsedCommandLine {
      let configFilePath = this.path.join(options.projectBase, options.configFile);
      this.logger.debug(`reading tsconfig.json from ${configFilePath}`);
      let configJson = JSON.parse(this.fs.readFileSync(configFilePath, 'utf-8'));
      let configDir = this.path.dirname(configFilePath);
      let configFileName = this.path.basename(configFilePath);

      return this.typescript.parseJsonConfigFileContent(
        configJson, this.typescript.sys, configDir, existingOpts, configFileName
      );
    }

    private createCompilerOptions(args: sbtweb.Arguments<sbtts.Options>): ts.CompilerOptions {
      this.logger.debug('creating compiler settings');
      let existingOpts = {
        rootDir: args.options.rootDir,
        baseUrl: args.options.baseUrl,
        outDir: args.target,
        sourceRoot: args.options.sourceRoot,
      };
      let config = this.getTSConfig(args.options, existingOpts);
      let compSettings = config.options;


      return compSettings;
    }

    private replaceFileExtension(fileName: string, ext: string): string {
      var oldExt = this.path.extname(fileName);

      return fileName.substring(0, fileName.length - oldExt.length) + ext;
    }

    private fixSourceMapFile(fileName: string) {
      /*
       All source .ts files are copied to public folder and reside there side by side with generated .js and js.map files.
       It means that source maps root at runtime is always '.' and 'sources' array should contain only file name.
       */
      let sourceMap = JSON.parse(this.fs.readFileSync(fileName, 'utf-8'));
      sourceMap.sources = sourceMap.sources.map((source: string) => this.path.basename(source));

      this.fs.writeFileSync(fileName, JSON.stringify(sourceMap), 'utf-8');
    }

    private prepareMessageText(diagnostic: ts.Diagnostic): string {
      // Sometimes the messageText is more than a string
      // In this case, we need to walk the "next" objects and build
      // the proper message text
      if (typeof diagnostic.messageText === 'object') {
        let messageText: string = '';
        let recurse = diagnostic.messageText as ts.Diagnostic;
        while (recurse !== undefined) {
          messageText += recurse.messageText + '\n';
          recurse = recurse.next;
        }

        return messageText.substring(0, messageText.length - 1);
      }

      return diagnostic.messageText as string;
    }

    private createProblem(diagnostic: ts.Diagnostic): sbtweb.Problem {
      this.logger.debug('recording diagnostic');
      let fileName = 'Global';
      let lineText = '';
      let lineCol: ts.LineAndCharacter = {line: 0, character: 0};
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
        message: this.prepareMessageText(diagnostic),
        source: fileName,
        severity: this.problemSeverities[diagnostic.category],
        lineContent: lineText
      };
    }

    private createFilesWrittenArray(outputFile: string, compilerOptions: ts.CompilerOptions): string[] {
      let filesWritten: string[] = [];

      let outputFileMap = `${outputFile}.map`;

      filesWritten.push(outputFile);
      if (compilerOptions.declaration) {
        let outputFileDeclaration = this.replaceFileExtension(outputFile, '.d.ts');
        filesWritten.push(outputFileDeclaration);
      }

      if (compilerOptions.sourceMap) {
        if (!this.args.options.sourceRoot) {
          this.fixSourceMapFile(outputFileMap);
        }

        filesWritten.push(outputFileMap);
      }

      return filesWritten;
    }

    private findDependencies(sourceFile: ts.SourceFile): string[] {
      let depFiles = sourceFile.referencedFiles;
      let deps = [sourceFile.fileName];

      if (depFiles !== undefined && depFiles.length > 0) {
        deps.concat(depFiles.map((dep) => dep.fileName));
      }

      return deps;
    }

    private getResults(sourceFiles: ts.SourceFile[], compilerOptions: ts.CompilerOptions, inputOutputFileMap: sbtts.Map): sbtweb.CompilationResult[] {
      let filesWrittenForSingleFile: string[] = [];
      if (compilerOptions.outFile) {
        filesWrittenForSingleFile = this.createFilesWrittenArray(compilerOptions.outFile, compilerOptions);
      }

      let createResult = (sourceFile: ts.SourceFile): sbtweb.CompilationResult => {
        this.logger.debug(`examining  ${sourceFile.fileName}`);

        let outputFile = inputOutputFileMap[this.path.normalize(sourceFile.fileName)];
        let filesWritten = (compilerOptions.outFile) ?
          filesWrittenForSingleFile :
          this.createFilesWrittenArray(outputFile, compilerOptions);

        return {
          source: sourceFile.fileName,
          result: {
            filesRead: this.findDependencies(sourceFile),
            filesWritten: filesWritten
          }
        };
      };

      return sourceFiles.map(createResult);
    }

    private getRelativePath(base: string, fileName: string): string {
      return fileName.replace(base, '');
    }

    private getProgramDiagnostics(program: ts.Program, emitOutput: ts.EmitOutput): ts.Diagnostic[] {
      let diagnostics = program.getSyntacticDiagnostics();
      if (diagnostics.length === 0) {
        diagnostics = program.getGlobalDiagnostics();
        if (diagnostics.length === 0) {
          diagnostics = program.getSemanticDiagnostics();
        }
      }

      return diagnostics.concat(emitOutput.diagnostics);
    }

    private createCompiler(sources: string[], compilerOptions: ts.CompilerOptions): ts.Program {
      this.logger.debug(`createProgram with ${sources}`);

      return this.typescript.createProgram(sources, compilerOptions);
    }

    private getOutputFileName(compilerOptions: ts.CompilerOptions, fileName: string): string {
      let relativeFilePath = this.getRelativePath(compilerOptions.rootDir, fileName);

      let finalPath = this.path.join(compilerOptions.outDir, this.replaceFileExtension(this.path.normalize(relativeFilePath), '.js'));
      this.logger.debug(`mapping file '${fileName}' to relative path '${relativeFilePath}' to '${finalPath}'`);
      return finalPath;
    }

    private buildInputOutputFilesMap(inputFiles: string[], compilerOptions: ts.CompilerOptions): sbtts.Map {
      let map: sbtts.Map = {};
      inputFiles.forEach((fileName: string) => {
        map[fileName] = this.getOutputFileName(compilerOptions, fileName);
      });

      return map;
    }

    public compile(args: sbtweb.Arguments<sbtts.Options>): sbtweb.CompilerOutput {
      let compilerOptions = this.createCompilerOptions(args);
      if (compilerOptions.outFile) {
        compilerOptions.outFile = this.getOutputFileName(compilerOptions, compilerOptions.outFile);
      }
      this.logger.debug(`compilerOptions = ${JSON.stringify(compilerOptions)}`);

      let compiler = this.createCompiler(args.options.sources, compilerOptions);
      this.logger.debug(`compiler: ${JSON.stringify(compiler)}`);
      let emitOutput = compiler.emit();
      this.logger.debug(`emitOutput: ${JSON.stringify(emitOutput)}`);

      let diagnostics = this.getProgramDiagnostics(compiler, emitOutput);

      let inputFiles = args.sourceFileMappings.map((pair) => pair[0]);
      let inputOutputFilesMap = this.buildInputOutputFilesMap(inputFiles, compilerOptions);

      let sourceFiles: ts.SourceFile[] = compiler.getSourceFiles()
        .filter((sourceFile: ts.SourceFile) => !!inputOutputFilesMap[this.path.normalize(sourceFile.fileName)]);

      let results = this.getResults(sourceFiles, compilerOptions, inputOutputFilesMap);
      let problems = diagnostics.map((diagnostic) => this.createProblem(diagnostic));
      this.logger.debug(`problems: ${JSON.stringify(problems)}`)
      return {
        results: results,
        problems: problems
      };
    }
  }
}
