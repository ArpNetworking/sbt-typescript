sbt-typescript  [![Build Status](https://travis-ci.org/ArpNetworking/sbt-typescript.svg?branch=master)](https://travis-ci.org/ArpNetworking/sbt-typescript)
<a href="http://search.maven.org/#search%7Cga%7C1%7Cg%3A%22com.arpnetworking%22%20a%3A%22sbt-typescript%22">
    <img src="https://img.shields.io/maven-central/v/com.arpnetworking/sbt-typescript.svg"
         alt="Maven Artifact">
</a>
========

Allows TypeScript to be used from within sbt. Leverages the functionality of com.typesafe.sbt:js-engine to run the 
typescript compiler.

To use this plugin use the addSbtPlugin command within your project's plugins.sbt (or as a global setting) i.e.:

```scala
addSbtPlugin("com.arpnetworking" % "sbt-typescript" % "0.1.10")
```

You will also need to enable the SbtWeb plugin in your project.

The options provided mimic the arguments to the tsc command line compiler.

Option              | Description
--------------------|------------
declaration         | Generates corresponding '.d.ts' file.
sourceMap           | Generates source maps for input files.
sourceRoot          | Specifies the location where the compiler should locate TypeScript files instead of the source locations.
mapRoot             | Specifies the location where the compiler should locate map files instead of generated locations.
target              | ECMA script target version. Should be "ES3" or "ES5" (default).
noImplicitAny       | Warn on expressions and declarations with an implied "any" type.
moduleKind          | Specifies module code generation. Should be "" (default), "commonjs", or "amd".
outFile             | Concatenate and emit output to a single file. 
outDir              | Destination directory for output files.
removeComments      | Removes comments from the generated source.
jsx                 | Specifices JSX-mode for .tsx files. Should be "preserve" (default) to generate .jsx or "react" to generate .js files.
    
By default, all typescript files (*.ts and *.tsx) are included in the compilation and will generate corresponding javascript
files.  To change this, supply an includeFilter in the TypescriptKeys.typescript task configuration.

For example:

```scala
includeFilter in TypescriptKeys.typescript := "myFile.ts"
```

You can also set an exclude filter in the same way.

A note on typescript compiling speed
------------------------------------

Sometimes the default engine (Trireme) can be quite slow. If you're experiencing long typescript compile times you can always switch to node.js ([remember to install it first](http://nodejs.org/download/)) adding this line to your `build.sbt` file:

```scala
JsEngineKeys.engineType := JsEngineKeys.EngineType.Node
```

&copy; Groupon Inc., 2014
