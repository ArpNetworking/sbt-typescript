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

import sbt._
import com.typesafe.sbt.jse.SbtJsTask
import com.typesafe.sbt.web.SbtWeb
import sbt.Keys._
import spray.json.{JsString, JsBoolean, JsObject}
import com.google.common.io.Files
import com.google.common.base.Charsets
import scala.io.Source
import org.apache.commons.lang3.StringEscapeUtils

object Import {

  object TypescriptKeys {
    val typescript = TaskKey[Seq[File]]("typescript", "Invoke the typescript compiler.")
    val typescriptGenerateCompiler = TaskKey[File]("generateCompiler", "Generates the typescript compile script.")

    val sourceMap = SettingKey[Boolean]("typescript-source-map", "Outputs a source map for typescript files.")
    val sourceRoot = SettingKey[String]("typescript-source-root", "Specifies the location where debugger should locate TypeScript files instead of source locations.")
    val mapRoot = SettingKey[String]("typescript-map-root", "Specifies the location where debugger should locate map files instead of generated locations.")
    val target = SettingKey[String]("typescript-target", "ECMAScript target version: 'ES3' (default), or 'ES5'.")
    val noImplicitAny = SettingKey[Boolean]("typescript-no-implicit-any", "Warn on expressions and declarations with an implied 'any' type.")
    val moduleKind = SettingKey[String]("typescript-module", "Specify module code generation: 'commonjs' or 'amd'.")
    val outFile = SettingKey[String]("typescript-output-file", "Concatenate and emit output to a single file.")
    val outDir = SettingKey[String]("typescript-output-directory", "Redirect output structure to the directory.")
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

    includeFilter in typescript := GlobFilter("*.ts"),
    excludeFilter in typescript := GlobFilter("*.d.ts"),

    sources in typescript := (sourceDirectories.value ** ((includeFilter in typescript).value -- (excludeFilter in typescript).value)).get,

    jsOptions := JsObject(
      "sourceMap" -> JsBoolean(sourceMap.value),
      "sourceRoot" -> JsString(sourceRoot.value),
      "mapRoot" -> JsString(mapRoot.value),
      "target" -> JsString(target.value),
      "noImplicitAny" -> JsBoolean(noImplicitAny.value),
      "moduleKind" -> JsString(moduleKind.value),
      "outFile" -> JsString(outFile.value),
      "outDir" -> JsString(outDir.value),
      "removeComments" -> JsBoolean(removeComments.value)

    ).toString(),

    typescriptGenerateCompiler in typescript := {
      val compileFile = taskTemporaryDirectory.value / "typescript" / "generatedCompiler.js"
      compileFile.getParentFile.mkdirs()

      val output = Files.newWriter(compileFile, Charsets.UTF_8)
      val cl = getClass.getClassLoader

      val libdtsStream = cl.getResourceAsStream("typescript/lib.d.ts")
      val libdtsFile = Source.fromInputStream(libdtsStream)
      val libdtsString = libdtsFile.getLines().mkString("\n")

      output.write("/*global process, require */\n")

      output.write("\nvar libdts = \"" + StringEscapeUtils.escapeEcmaScript(libdtsString) + "\"")

      //Write the official typescript compiler
      val tscStream = cl.getResourceAsStream("typescript/typescript.js")
      val tscFile = Source.fromInputStream(tscStream)
      output.write(tscFile.getLines().mkString("\n"))

      //Write the typescript compiler shim
      val typescriptcStream = cl.getResourceAsStream("typescriptc.js")
      val typescriptcFile = Source.fromInputStream(typescriptcStream)
      output.write(typescriptcFile.getLines().mkString("\n"))

      output.flush()
      output.close()
      compileFile
    }
  )

  override def projectSettings = Seq(

    sourceMap := false,
    sourceRoot := "",
    mapRoot := "",
    target := "ES5",
    noImplicitAny := false,
    moduleKind := "",
    outFile := "",
    outDir := "",
    removeComments := false

  ) ++ inTask(typescript)(
    SbtJsTask.jsTaskSpecificUnscopedSettings ++
      inConfig(Assets)(typescriptUnscopedSettings) ++
      inConfig(TestAssets)(typescriptUnscopedSettings) ++
      Seq(
        moduleName := "javascripts",
        shellFile := (taskTemporaryDirectory.value / "typescript" / "generatedCompiler.js").asURL,

        taskMessage in Assets := "TypeScript compiling",
        taskMessage in TestAssets := "TypeScript test compiling"
      )
  ) ++ SbtJsTask.addJsSourceFileTasks(typescript) ++ Seq(
    typescript in Assets := (typescript in Assets).dependsOn(webModules in Assets).value,
    typescript in Assets := (typescript in Assets).dependsOn(nodeModules in Assets).value,
    typescript in Assets := (typescript in Assets).dependsOn(typescriptGenerateCompiler in typescript in Assets).value,
    typescript in TestAssets := (typescript in TestAssets).dependsOn(webModules in TestAssets).value,
    typescript in TestAssets := (typescript in TestAssets).dependsOn(nodeModules in TestAssets).value,
    typescript in TestAssets := (typescript in TestAssets).dependsOn(typescriptGenerateCompiler in typescript in TestAssets).value
  )

}
