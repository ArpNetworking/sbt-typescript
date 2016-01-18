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

import com.typesafe.sbt.jse.JsEngineImport.JsEngineKeys
import sbt._
import com.typesafe.sbt.jse.SbtJsTask
import com.typesafe.sbt.web.SbtWeb
import sbt.Keys._
import spray.json.{JsString, JsBoolean, JsObject}

object Import {

  object TypescriptKeys {
    val typescript = TaskKey[Seq[File]]("typescript", "Invoke the typescript compiler.")
    val typescriptGenerateCompiler = TaskKey[File]("generateCompiler", "Generates the typescript compile script.")

    val declaration = SettingKey[Boolean]("typescript-declaration", "Generates corresponding '.d.ts' file.")
    val sourceMap = SettingKey[Boolean]("typescript-source-map", "Outputs a source map for typescript files.")
    val sourceRoot = SettingKey[String]("typescript-source-root", "Specifies the location where debugger should locate TypeScript files instead of source locations.")
    val mapRoot = SettingKey[String]("typescript-map-root", "Specifies the location where debugger should locate map files instead of generated locations.")
    val target = SettingKey[String]("typescript-target", "ECMAScript target version: 'ES3' (default), or 'ES5'.")
    val noImplicitAny = SettingKey[Boolean]("typescript-no-implicit-any", "Warn on expressions and declarations with an implied 'any' type.")
    val moduleKind = SettingKey[String]("typescript-module", "Specify module code generation: 'commonjs' or 'amd'.")
    val outFile = SettingKey[String]("typescript-output-file", "Concatenate and emit output to a single file.")
    val outDir = SettingKey[String]("typescript-output-directory", "Redirect output structure to the directory.")
    val jsx = SettingKey[String]("typescript-jsx-mode", "Specify JSX mode for .tsx files: 'preserve' (default) or 'react'.")
    val removeComments = SettingKey[Boolean]("typescript-remove-comments", "Remove comments from output.")
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

    includeFilter in typescript := GlobFilter("*.ts") | GlobFilter("*.tsx"),
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
      "logLevel" -> JsString(logLevel.value.toString)

    ).toString()
  )

  override def projectSettings = Seq(

    declaration := false,
    sourceMap := false,
    sourceRoot := "",
    mapRoot := "",
    target := "ES5",
    noImplicitAny := false,
    moduleKind := "",
    outFile := "",
    outDir := ((webTarget in Assets).value / "typescript").absolutePath,
    removeComments := false,
    jsx := "preserve",
    JsEngineKeys.parallelism := 1,
    logLevel := Level.Info

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
    typescript in Assets := (typescript in Assets).dependsOn(webModules in Assets).value,
    typescript in TestAssets := (typescript in TestAssets).dependsOn(webModules in TestAssets).value
  )

}
