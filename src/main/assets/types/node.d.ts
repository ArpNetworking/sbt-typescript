export namespace node {
  export interface fs {
    readFileSync(fileName: string, encoding: string): string;
    writeFileSync(fileName: string, content: string, encoding: string): void;
  }

  export interface path {
    join(first: string, second: string): string;
    dirname(path: string): string;
    basename(path: string): string;
    extname(fileName: string): string;
    normalize(path: string): string;
  }

  export interface NodeRequireFunction {
    (id: string): any;
  }

  export interface NodeRequire extends NodeRequireFunction {
    resolve(id: string): string;
    cache: any;
    extensions: any;
    main: any;
  }

  export interface Process {
    argv: string[];
    execArgv: string[];
    execPath: string;
    abort(): void;
    chdir(directory: string): void;
    cwd(): string;
    env: any;
    exit(code?: number): void;
    exitCode: number;
    getgid(): number;
    setgid(id: number): void;
    setgid(id: string): void;
    getuid(): number;
    setuid(id: number): void;
    setuid(id: string): void;
    version: string;

    config: {
      target_defaults: {
        cflags: any[];
        default_configuration: string;
        defines: string[];
        include_dirs: string[];
        libraries: string[];
      };
      variables: {
        clang: number;
        host_arch: string;
        node_install_npm: boolean;
        node_install_waf: boolean;
        node_prefix: string;
        node_shared_openssl: boolean;
        node_shared_v8: boolean;
        node_shared_zlib: boolean;
        node_use_dtrace: boolean;
        node_use_etw: boolean;
        node_use_openssl: boolean;
        target_arch: string;
        v8_no_strict_aliasing: number;
        v8_use_snapshot: boolean;
        visibility: string;
      };
    };

    kill(pid: number, signal?: string | number): void;
    pid: number;
    title: string;
    arch: string;
    platform: string;

    nextTick(callback: Function, ...args: any[]): void;
    umask(mask?: number): number;
    uptime(): number;
    hrtime(time?: number[]): number[];

    send?(message: any, sendHandle?: any): void;
    disconnect(): void;
    connected: boolean;
  }
}
