export namespace sbtweb {
  export type Severity = 'warn' | 'error' | 'info';

  export interface Problem {
    lineNumber: number;
    characterOffset: number;
    source: string;
    severity: Severity;
    lineContent: string;
    message: string;
  }

  export interface Arguments<T> {
    sourceFileMappings: string[][];
    target: string;
    options: T;
  }

  export interface CompilerOutput {
    results: CompilationResult[];
    problems: Problem[];
  }

  export interface FileResult {
    filesRead: string[];
    filesWritten: string[];
  }

  export interface CompilationResult {
    source: string;
    result: FileResult
  }
}
