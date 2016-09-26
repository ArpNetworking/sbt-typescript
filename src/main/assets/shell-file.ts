/*
 * Copyright 2014 Groupon.com
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
///<reference path="types/node.d.ts"/>
///<reference path="types/sbt-ts.d.ts"/>
///<reference path="typescript-compiler.ts"/>

(() => {
  const fs = require('fs');
  const jst = require('jstranspiler');
  const ts = require('typescript');
  const path = require('path');
  const args = jst.args(process.argv);

  const typescriptCompiler = new sbtts.TypescriptCompiler(fs, path, ts, args);
  const compilerOutput = typescriptCompiler.compile(args);

  console.log('\u0010' + JSON.stringify(compilerOutput));
})();
