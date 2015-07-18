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

import com.typesafe.sbt.jse.JsEngineImport.JsEngineKeys
import java.util.concurrent.atomic.AtomicInteger
import sbt._
import sbt.Keys._

import com.typesafe.sbt.web.SbtWeb
import com.typesafe.sbt.web.SbtWeb.autoImport._

object TestBuild extends Build {

  class TestLogger(target: File) extends Logger {
    val unrecognisedInputCount = new AtomicInteger(0)

    def trace(t: => Throwable): Unit = {}

    def success(message: => String): Unit = {}

    def log(level: Level.Value, message: => String): Unit = {
      if (level == Level.Error) {
        if (message.contains("is not assignable to parameter") &&
          message.contains("bad.ts") &&
          message.contains(":24")) {
            IO.touch(target / "valid-error")
        }
      }
    }
  }

  class TestReporter(target: File) extends LoggerReporter(-1, new TestLogger(target))

  lazy val root = Project(
    id = "test-build",
    base = file("."),
    settings = Seq(WebKeys.reporter := new TestReporter(target.value), JsEngineKeys.engineType := JsEngineKeys.EngineType.Node)
  ).enablePlugins(SbtWeb)

}
