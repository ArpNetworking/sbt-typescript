declare namespace ts {
  interface LineAndCharacter {
    line: number
    character: number
  }

  interface DiagnosticFile {
    fileName: string;
    text: string;
    getLineAndCharacterOfPosition(start: number): LineAndCharacter;
    getLineStarts(): any;

  }

  interface Diagnostic {
    category: number;
    start: number;
    file: DiagnosticFile;
    next: Diagnostic;
    messageText: Diagnostic | string;
  }

  interface CompilerOptions {
    sourceRoot?: string;
    baseUrl?: string;
    outDir?: string;
    rootDir?: string;
    outFile?: string;
    sourceMap?: boolean;
    declaration?: boolean;
  }

  interface SourceFile {
    fileName: string;
    referencedFiles: SourceFile[];
  }

  interface Program {
    getSyntacticDiagnostics(): Diagnostic[];
    getGlobalDiagnostics(): Diagnostic[];
    getSemanticDiagnostics(): Diagnostic[];
    emit(): EmitOutput;
    getSourceFiles(): SourceFile[];
  }

  interface EmitOutput {
    diagnostics: Diagnostic[];
  }

  interface TypescriptApi {
    sys: any;
    parseJsonConfigFileContent(json: any, host: ParseConfigHost, basePath: string,
                               existingOptions?: CompilerOptions, configFileName?: string,
                               resolutionStack?: Path[]): ParsedCommandLine
    createCompilerHost(compilerSettings: CompilerOptions): CompilerHost;
    createProgram(sources: string[], compilerOptions: CompilerOptions, compilerHost: CompilerHost): Program;
  }

  interface CompilerHost {

  }

  interface ParsedCommandLine {
    options: CompilerOptions;
  }

  interface ParseConfigHost {

  }

  interface Path {

  }
}
