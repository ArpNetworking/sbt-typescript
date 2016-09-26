declare namespace sbtweb {
  type Severity = 'warn' | 'error' | 'info';

  interface Problem {
    lineNumber: number;
    characterOffset: number;
    source: string;
    severity: Severity;
    lineContent: string;
    message: string;
  }

  interface Arguments<T> {
    sourceFileMappings: string[][];
    target: string;
    options: T;
  }

  interface CompilerOutput {
    results: CompilationResult[];
    problems: Problem[];
  }

  interface FileResult {
    filesRead: string[];
    filesWritten: string[];
  }

  interface CompilationResult {
    source: string;
    result: FileResult
  }
}
