/*
 * Copyright 2014 Groupon.com
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import com.typesafe.sbt.jse.JsEngineImport.JsEngineKeys

import com.typesafe.sbt.web.SbtWeb
import com.arpnetworking.sbt._



lazy val root = (project in file("."))
  .enablePlugins(SbtWeb)
  .settings (Seq(WebKeys.reporter := new TestReporter(target.value), JsEngineKeys.engineType := JsEngineKeys.EngineType.Node), name := "test-build")

