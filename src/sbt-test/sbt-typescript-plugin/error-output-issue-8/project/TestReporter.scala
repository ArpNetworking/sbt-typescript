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

import com.typesafe.sbt.web.CompileProblems.LoggerReporter

package com.arpnetworking.sbt {
  import sbt.internal.inc.schema.Severity
  import sbt.internal.util.ManagedLogger
  import xsbti.Problem

  class TestLogger() extends ManagedLogger ("logger", Option.empty, Option.empty, null) {

    override def trace(t: => Throwable): Unit = {}

    override def success(message: => String): Unit = {}

    override def log(level: Level.Value, message: => String): Unit = {}
  }

  class TestReporter(target: File) extends LoggerReporter(-1, new TestLogger()) {
    override def log(problem: Problem): Unit = {
      if (problem.severity.eq(xsbti.Severity.Error)) {
        if (problem.message().contains("is not assignable to parameter") &&
          problem.position().sourceFile().map[String](_.name).orElse("").contains("bad.ts") &&
          problem.position().line().orElse(0).intValue() == 25) {
          IO.touch(target / "valid-error")
        }
      }
    }
  }

}

