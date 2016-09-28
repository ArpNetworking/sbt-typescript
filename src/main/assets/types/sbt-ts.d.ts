export namespace sbtts {
  export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

  export interface Options {
    logLevel: LogLevel;
    sources: string[];
    sourceRoot: string;
    baseUrl: string;
    rootDir: string;
    configFile: string;
    projectBase: string;
  }

  export interface Map {
    [key: string]: string;
  }
}
