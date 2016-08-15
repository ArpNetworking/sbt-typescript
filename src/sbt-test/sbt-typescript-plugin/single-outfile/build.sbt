import java.nio.file.Files

import com.arpnetworking.sbt.typescript.Import.TypescriptKeys._
import sbt.complete.DefaultParsers._

lazy val root = (project in file(".")).enablePlugins(SbtWeb).settings(
  JsEngineKeys.engineType := JsEngineKeys.EngineType.Node,
  outFile     := "app.js", // Create a single output file
  moduleKind  := "AMD",
  sourceMap   := true,
  sourceRoot  := "/assets/", // Map the root folder to a URL on the server
  allowJS     := true, // Allow "legacy" JS files to be included and compiled into the single output file
  typingsFile := Some(file("typings/index.d.ts")) // Include the typings root file
)

lazy val assertMatches = inputKey[Unit]("")

assertMatches := {
  spaceDelimited("<arg>").parsed.map(file) match {
    case Seq(actual, expected) ⇒
      assert(actual.exists, s"Generated file ${actual.getName} does not exist")
      assert(expected.exists, s"Expected file ${expected.getName} does not exist")
      assert(readAllText(actual) == readAllText(expected), s"Generated file ${actual.getName} does not match expected")
  }
}

def readAllText(file: File) = new String(Files.readAllBytes(file.toPath), "UTF-8")

