var modules: any = {};
modules['require'] = require;
modules['exports'] = {};

function define(id: string, deps: any, factory: (...args: any[]) => any) {
  let args = deps.map((dep: string) => modules[dep]);
  factory(...args);
  modules[id] = modules['exports'];
}
