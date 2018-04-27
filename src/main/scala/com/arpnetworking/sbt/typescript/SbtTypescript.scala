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
import sbt.{Def, _}
import com.typesafe.sbt.jse.SbtJsTask
import com.typesafe.sbt.web.SbtWeb
import sbt.Keys._
import spray.json.{JsArray, JsObject, JsString}
import SbtWeb.autoImport._
import WebKeys._
import SbtJsTask.autoImport.JsTaskKeys._
import sbt.util.Level


object Import {

  object TypescriptKeys {
    val typescript = TaskKey[Seq[File]]("typescript", "Invoke the typescript compiler.")
    val typescriptGenerateCompiler = TaskKey[File]("generateCompiler", "Generates the typescript compile script.")

    val sourceRoot = SettingKey[String]("typescript-source-root", "Specifies the location where debugger should locate TypeScript files instead of source locations.")
    val configFile = SettingKey[String]("config-file", "Name of the config file. By default the sbt-typescript will look into the assets directory")
  }

}

object SbtTypescript extends AutoPlugin {

  override def requires: SbtJsTask.type = SbtJsTask

  override def trigger = AllRequirements

  import Import.TypescriptKeys._

  val typescriptUnscopedSettings = Seq(

    includeFilter in typescript := GlobFilter("*.ts") | GlobFilter("*.tsx"),

    excludeFilter in typescript := GlobFilter("*.d.ts"),

    sources in typescript := (sourceDirectories.value ** ((includeFilter in typescript).value -- (excludeFilter in typescript).value)).get,

    jsOptions := JsObject(
      "sourceRoot" -> JsString(sourceRoot.value),
      "logLevel" -> JsString(logLevel.value.toString),
      "rootDir" -> JsString((sourceDirectory in Assets).value.absolutePath),
      "baseUrl" -> JsString(((webJarsDirectory in Assets).value / "lib").absolutePath),
      "configFile" -> JsString(configFile.value),
      "projectBase" -> JsString(baseDirectory.value.absolutePath),
      "sources" -> JsArray(sources.value.filter(_.isFile).map(file => JsString(file.absolutePath)).toVector)
    ).toString()
  )

  def relative(base: String, fullPath: String): String = fullPath.replace(base, "")

  override def projectSettings: Seq[Def.Setting[_ >: Int with String with Level.Value with Task[Seq[File]]]] = {
    Seq(
      JsEngineKeys.parallelism := 1,
      sourceRoot := "",
      logLevel := Level.Info,
      configFile := relative(baseDirectory.value.absolutePath, ((sourceDirectory in Assets).value / "tsconfig.json").absolutePath)
    ) ++ inTask(typescript)(
      SbtJsTask.jsTaskSpecificUnscopedProjectSettingsSettings ++
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
}
