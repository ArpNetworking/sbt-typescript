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

package com.arpnetworking.sbt.typescript

import java.io.File
import com.typesafe.sbt.jse.JsEngineImport.JsEngineKeys
import sbt._
import com.typesafe.sbt.jse.SbtJsTask
import com.typesafe.sbt.web.SbtWeb
import sbt.Keys._
import spray.json.{JsValue, JsNull, JsString, JsBoolean, JsObject, JsArray}

object Import {

  object TypescriptKeys {
    val typescript = TaskKey[Seq[File]]("typescript", "Invoke the typescript compiler.")
    val typescriptGenerateCompiler = TaskKey[File]("generateCompiler", "Generates the typescript compile script.")
    val cleanTsCache = taskKey[Unit]("Clean after stage task")

    val declaration = SettingKey[Boolean]("typescript-declaration", "Generates corresponding '.d.ts' file.")
    val sourceMap = SettingKey[Boolean]("typescript-source-map", "Outputs a source map for typescript files.")
    val sourceRoot = SettingKey[String]("typescript-source-root", "Specifies the location where debugger should locate TypeScript files instead of source locations.")
    val mapRoot = SettingKey[String]("typescript-map-root", "Specifies the location where debugger should locate map files instead of generated locations.")
    val target = SettingKey[String]("typescript-target", "ECMAScript target version: 'ES3', 'ES5' (default), 'ES6', 'ES2015', 'Latest'.")
    val noImplicitAny = SettingKey[Boolean]("typescript-no-implicit-any", "Warn on expressions and declarations with an implied 'any' type.")
    val moduleKind = SettingKey[String]("typescript-module", "Specify module code generation: 'Commonjs', 'AMD' or 'System'.")
    val outFile = SettingKey[String]("typescript-output-file", "Concatenate and emit output to a single file.")
    val outDir = SettingKey[String]("typescript-output-directory", "Redirect output structure to the directory.")
    val jsx = SettingKey[String]("typescript-jsx-mode", "Specify JSX mode for .tsx files: 'Preserve' (default) 'React' or 'None'.")
    val removeComments = SettingKey[Boolean]("typescript-remove-comments", "Remove comments from output.")
    val experimentalDecorators = SettingKey[Boolean]("--experimentalDecorators", "Experimental support for decorators is a feature that is subject to change in a future release.")
    val moduleResolutionKind = SettingKey[String]("--moduleResolution", "'NodeJs' or 'Classic'. 'NodeJs' by default")
    val emitDecoratorMetadata = SettingKey[Boolean]("--emitDecoratorMetadata", "true or false")
    val rootDir = SettingKey[String]("rootDir", "The location of the typescript source files")
    val baseUrl = SettingKey[String]("--baseUrl", "A directory where the compiler should look for modules")
    val traceResolution = SettingKey[Boolean]("--traceResolution", "Offers a handy way to understand how modules have been resolved by the compiler")
    val paths = SettingKey[Map[String, Seq[String]]]("paths", "Will map one path to another")
    val allowJS = SettingKey[Boolean]("typescript-allow-js", "Allow JavaScript files to be compiled")
    val typingsFile = SettingKey[Option[File]]("typescript-typings-file", "A file that refers to typings that the build needs. Default None.")
  }
}

object SbtTypescript extends AutoPlugin {

  override def requires = SbtJsTask

  override def trigger = AllRequirements

  val autoImport = Import

  import SbtWeb.autoImport._
  import WebKeys._
  import SbtJsTask.autoImport.JsTaskKeys._
  import autoImport.TypescriptKeys._

  val typescriptUnscopedSettings = Seq(

    includeFilter in typescript := (
      if (allowJS.value) {
        GlobFilter("*.ts") | GlobFilter("*.tsx") | GlobFilter("*.js") | GlobFilter("*.jsx")
      } else {
        GlobFilter("*.ts") | GlobFilter("*.tsx")
      }
    ),
    excludeFilter in typescript := GlobFilter("*.d.ts"),

    sources in typescript := (sourceDirectories.value ** ((includeFilter in typescript).value -- (excludeFilter in typescript).value)).get,

    jsOptions := JsObject(
      "declaration" -> JsBoolean(declaration.value),
      "sourceMap" -> JsBoolean(sourceMap.value),
      "sourceRoot" -> JsString(sourceRoot.value),
      "mapRoot" -> JsString(mapRoot.value),
      "target" -> JsString(target.value),
      "noImplicitAny" -> JsBoolean(noImplicitAny.value),

      "moduleKind" -> JsString(moduleKind.value),
      "outFile" -> JsString(outFile.value),
      "outDir" -> JsString(outDir.value),
      "removeComments" -> JsBoolean(removeComments.value),
      "jsx" -> JsString(jsx.value),
      "logLevel" -> JsString(logLevel.value.toString),
      "experimentalDecorators" -> JsBoolean(experimentalDecorators.value),
      "emitDecoratorMetadata" -> JsBoolean(emitDecoratorMetadata.value),
      "moduleResolutionKind" -> JsString(moduleResolutionKind.value),
      "rootDir" -> JsString(rootDir.value),
      "baseUrl" -> JsString(baseUrl.value),
      "traceResolution" -> JsBoolean(traceResolution.value),
      "paths" -> JsObject(mapToJs(paths.value)),
      "allowJs" → JsBoolean(allowJS.value),
      "typingsFile" → typingsFile.value.fold[JsValue](JsNull)(f ⇒ JsString(f.absolutePath))
    ).toString()
  )

  override def projectSettings = Seq(

    declaration := false,
    sourceMap := false,
    sourceRoot := "",
    mapRoot := "",
    target := "ES5",
    noImplicitAny := false,
    moduleKind := "AMD",
    outFile := "",
    outDir := ((webTarget in Assets).value / "typescript").absolutePath,
    removeComments := false,
    jsx := "Preserve",
    JsEngineKeys.parallelism := 1,
    logLevel := Level.Info,
    experimentalDecorators := false,
    emitDecoratorMetadata := false,
    moduleResolutionKind := "NodeJs",
    rootDir := (sourceDirectory in Assets).value.absolutePath,
    baseUrl := ((webJarsDirectory in Assets).value / "lib").absolutePath,
    traceResolution := false,
    paths := Map(),
    allowJS := false,
    typingsFile := None
  ) ++ inTask(typescript)(
    SbtJsTask.jsTaskSpecificUnscopedSettings ++
      inConfig(Assets)(typescriptUnscopedSettings) ++
      inConfig(TestAssets)(typescriptUnscopedSettings) ++
      Seq(
        moduleName := "typescript",
        shellFile := getClass.getClassLoader.getResource("typescriptc.js"),

        taskMessage in Assets := "TypeScript compiling",
        taskMessage in TestAssets := "TypeScript test compiling"
      )
  ) ++ SbtJsTask.addJsSourceFileTasks(typescript) ++ Seq(
    cleanTsCache := {
      println("Clean typescript cache")
      val fileToDelete = baseDirectory.value / "target" / "web" / "typescript"
      def delete(f: File) {
        if (f.isDirectory) {
          f.listFiles().foreach(c => delete(c))
        }
        f.delete()
      }
      delete(fileToDelete)
    },
    typescript in Assets := (typescript in Assets).dependsOn(cleanTsCache).dependsOn(webModules in Assets).value,
    typescript in TestAssets := (typescript in TestAssets).dependsOn(webModules in TestAssets).value
  )

  private def mapToJs(value: Map[String, Seq[String]]): Map[String, JsArray] = {
    value.map((f) => f._1 -> JsArray(f._2.map(a => JsString(a)): _*))
  }
}
