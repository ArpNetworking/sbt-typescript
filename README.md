sbt-typescript
==============

<a href="https://raw.githubusercontent.com/ArpNetworking/sbt-typescript/master/LICENSE">
    <img src="https://img.shields.io/hexpm/l/plug.svg"
         alt="License: Apache 2">
</a>
<a href="https://travis-ci.org/ArpNetworking/sbt-typescript/">
    <img src="https://travis-ci.org/ArpNetworking/sbt-typescript.png"
         alt="Travis Build">
</a>
<a href="http://search.maven.org/#search%7Cga%7C1%7Cg%3A%22com.arpnetworking%22%20a%3A%22sbt-typescript%22">
    <img src="https://img.shields.io/maven-central/v/com.arpnetworking/sbt-typescript.svg"
         alt="Maven Artifact">
</a>

Allows TypeScript to be used from within sbt. Leverages the functionality of com.typesafe.sbt:js-engine to run the
typescript compiler.

To use this plugin use the addSbtPlugin command within your project's plugins.sbt (or as a global setting) i.e.:

```scala
addSbtPlugin("com.arpnetworking" % "sbt-typescript" % "0.4.3")
resolvers += Resolver.typesafeRepo("releases")
```

You will also need to enable the SbtWeb plugin in your project.

The options provided mimic the arguments to the tsc command line compiler (for the versions < 0.3.0).

Option                 | Description
-----------------------|------------
allowJS                | Allow JavaScript files to be compiled.
declaration            | Generates corresponding '.d.ts' file.
sourceMap              | Generates source maps for input files.
sourceRoot             | Specifies the location where the compiler should locate TypeScript files instead of the source locations on the webserver. (Note this is require if using `outFile` to compile into a single file)
mapRoot                | Specifies the location where the compiler should locate map files instead of generated locations.
target                 | ECMA script target version. Should be "ES3" or "ES5" (default).
noImplicitAny          | Warn on expressions and declarations with an implied "any" type.
moduleKind             | Specifies module code generation. Should be "" (default), "None", "CommonJS", "AMD", "UMD", "System", "ES6" and "ES2015".
outFile                | Concatenate and emit output to a single file.
outDir                 | Destination directory for output files.
removeComments         | Removes comments from the generated source.
jsx                    | Specifices JSX-mode for .tsx files. Should be "None", "Preserve" (default) to generate .jsx or "React" to generate .js files.
experimentalDecorators | Experimental decorators support. Set this to true if you have an angular2 project.
emitDecoratorMetadata  | This will write decorator metadata to your js files. Set this to true if you have an angular2 project.
moduleResolutionKind   | "NodeJs" or "Classic" module resolution.
typingsFile            | A file that refers to typings that the build needs. Default None, but would normally be "/typings/index.d.ts"

tsconfig.json support (version >= 0.3.0)
----------------------------------------

From the version 0.3.0 you can define typescript settings only with a tsconfig.json file. The sbt-typescript will look for a tsconfig.file in the assets
directory by default. If there is no file, an error would occur.

By default, all typescript files (*.ts and *.tsx) are included in the compilation and will generate corresponding javascript
files. In addition, if source map generation is enabled, the .ts and .tsx files will be copied to the output directory in 
order to make source maps work.  To change this, supply an includeFilter in the TypescriptKeys.typescript task configuration.

The supported sbt settings are:

Option                 | Description
-----------------------|------------
configFile             | By default the sbt-typescript will look into the assets directory (app/assets/tsconfig.json). If you want sbt-typescript look into the root folder, just set this property to 'yourconfigname.json'
sourceRoot             | Specifies the location where debugger should locate TypeScript files instead of source locations.

include and exclude, baseUrl properties of tsconfig are not supported.


For including specific files of your project you can write something like:

```scala
includeFilter in (Assets, typescript) := GlobFilter("myFile.ts")
```

You can also set an exclude filter in the same way:

```scala
excludeFilter in (Assets,typescript) := GlobFilter("*.d.ts") | GlobFilter("*.spec.ts") | GlobFilter("**/typings")
```

A note on typescript compiling speed
------------------------------------

Sometimes the default engine (Trireme) can be quite slow. If you're experiencing long typescript compile times you can always switch to node.js ([remember to install it first](http://nodejs.org/download/)) adding this line to your `build.sbt` file:

```scala
JsEngineKeys.engineType := JsEngineKeys.EngineType.Node
```

Versions
--------

The TypeScript version included in sbt-typescript and the Scala version support are as follows.

Version | TypesScript | Scala
--------|-------------|-------
0.4.2   | 2.6.2       | 2.12.5
0.4.1   | 2.6.2       | 2.12.5
0.3.6   | 2.6.2       | 2.10.7, 2.11.12, 2.12.5
0.3.5   | 2.6.2       | 2.10.5
0.3.4   | 2.3.1       | 2.10.5
0.3.3   | 2.2.1       | 2.10.5
0.3.2   | 2.0.2       | 2.10.5
0.3.1   | 2.0.2       | 2.10.5
0.2.3   | 2.0.0       | 2.10.5
0.2.2   | 2.0.0       | 2.10.5

&copy; Groupon Inc., 2014
