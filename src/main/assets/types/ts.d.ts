export namespace ts {
  export interface LineAndCharacter {
    line: number
    character: number
  }

  export interface DiagnosticFile {
    fileName: string;
    text: string;
    getLineAndCharacterOfPosition(start: number): LineAndCharacter;
    getLineStarts(): any;

  }

  export interface Diagnostic {
    category: number;
    start: number;
    file: DiagnosticFile;
    next: Diagnostic;
    messageText: Diagnostic | string;
  }

  export interface CompilerOptions {
    sourceRoot?: string;
    baseUrl?: string;
    outDir?: string;
    rootDir?: string;
    outFile?: string;
    sourceMap?: boolean;
    declaration?: boolean;
  }

  export interface SourceFile {
    fileName: string;
    referencedFiles: SourceFile[];
  }

  export interface Program {
    getSyntacticDiagnostics(): Diagnostic[];
    getGlobalDiagnostics(): Diagnostic[];
    getSemanticDiagnostics(): Diagnostic[];
    emit(): EmitOutput;
    getSourceFiles(): SourceFile[];
  }

  export interface EmitOutput {
    diagnostics: Diagnostic[];
  }

  export interface TypescriptApi {
    sys: any;
    parseJsonConfigFileContent(json: any, host: ParseConfigHost, basePath: string,
                               existingOptions?: CompilerOptions, configFileName?: string,
                               resolutionStack?: Path[]): ParsedCommandLine
    createCompilerHost(compilerSettings: CompilerOptions): CompilerHost;
    createProgram(sources: string[], compilerOptions: CompilerOptions, compilerHost: CompilerHost): Program;
  }

  export interface CompilerHost {

  }

  export interface ParsedCommandLine {
    options: CompilerOptions;
  }

  export interface ParseConfigHost {

  }

  export interface Path {

  }
}
