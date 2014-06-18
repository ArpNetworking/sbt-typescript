sbt-typescript
========

Allows TypeScript to be used from within sbt. Leverages the functionality of com.typesafe.sbt:js-engine to run the 
typescript compiler.

To use this plugin use the addSbtPlugin command within your project's plugins.sbt (or as a global setting) i.e.:

```scala
addSbtPlugin("com.arpnetworking" % "sbt-typescript" % "0.1.0")
```

You will also need to enable the SbtWeb plugin in your project.

The options provided mimic the arguments to the tsc command line compiler.

Option              | Description
--------------------|------------
sourceMap           | Generates source maps for input files.
sourceRoot          | Specifies the location where the compiler should locate TypeScript files instead of the source locations.
mapRoot             | Specifies the location where the compiler should locate map files instead of generated locations.
target              | ECMA script target version. Should be "ES3" (default) or "ES5".
noImplicitAny       | Warn on expressions and declarations with an implied "any" type.
moduleKind          | Specifies module code generation. Should be "" (default), "commonjs", or "amd".
outFile             | Concatenate and emit output to a single file. 
outDir              | Destination directory for output files.
removeComments      | Removes comments from the generated source.
    
By default, all typescript files (*.ts) are included in the compilation and will generate corresponding javascript
files.  To change this, supply an includeFilter in the TypescriptKeys.typescript task configuration.

For example:

```scala
includeFilter in TypescriptKeys.typescript := "myFile.ts"
```

You can also set an exclude filter in the same way.

&copy; Groupon Inc., 2014
