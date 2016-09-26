declare namespace sbtts {
  type LogLevel = 'debug' | 'info' | 'warn' | 'error';

  interface Options {
    logLevel: LogLevel;
    sources: string[];
    sourceRoot: string;
    baseUrl: string;
    rootDir: string;
    configFile: string;
    projectBase: string;
  }

  interface Map {
    [key: string]: string;
  }
}
