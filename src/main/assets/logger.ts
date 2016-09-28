///<reference path="define.ts"/>

export class Logger {
  logLevel: sbtts.LogLevel;

  constructor(logLevel: sbtts.LogLevel) {
    this.logLevel = logLevel;
  }

  debug(message: string) {
    if (this.logLevel === 'debug') {
      console.log(message);
    }
  }

  info(message: string) {
    if (this.logLevel === 'debug' || this.logLevel === 'info') {
      console.log(message);
    }
  }

  warn(message: string) {
    if (this.logLevel === 'debug' || this.logLevel === 'info' || this.logLevel === 'warn') {
      console.log(message);
    }
  }

  error(message: string, error: any) {
    if (this.logLevel === 'debug' || this.logLevel === 'info' || this.logLevel === 'warn' || this.logLevel === 'error') {
      if (error !== undefined) {
        var errorMessage = error.message;
        if (error.fileName !== undefined) {
          errorMessage = `${errorMessage} in ${error.fileName}`;
        }
        if (error.lineNumber !== undefined) {
          errorMessage = `$errorMessage at line ${error.lineNumber}`;
        }
        console.log(`${message} ${errorMessage}`);
      } else {
        console.log(message);
      }
    }
  }
}
