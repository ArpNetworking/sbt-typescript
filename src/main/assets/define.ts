var module = {};
var modules: any = {};
modules['require'] = require;
modules['exports'] = module;

let define = function (id: string, deps: any, factory: (...args: any[]) => any) {
  let args = deps.map((dep: string) => modules[dep]);
  factory(...args);
  modules[id] = args[1];
};
