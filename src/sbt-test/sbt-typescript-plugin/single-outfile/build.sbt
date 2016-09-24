import java.nio.file.Files

import com.arpnetworking.sbt.typescript.Import.TypescriptKeys._
import sbt.complete.DefaultParsers._

lazy val root = (project in file(".")).enablePlugins(SbtWeb).settings(
  JsEngineKeys.engineType := JsEngineKeys.EngineType.Node,
  sourceRoot  := "/assets/"
)

includeFilter in (Assets, typescript) := GlobFilter("*.ts") | GlobFilter("*.tsx") | GlobFilter("*.js") | GlobFilter("*.jsx")

lazy val assertMatches = inputKey[Unit]("")

assertMatches := {
  spaceDelimited("<arg>").parsed.map(file) match {
    case Seq(actual, expected) => {
      assert(actual.exists, s"Generated file ${actual.getName} does not exist")
      assert(expected.exists, s"Expected file ${expected.getName} does not exist")
      assert(readAllText(actual).trim == readAllText(expected).trim, s"Generated file ${actual.getName} does not match expected")
    }
  }
}

def readAllText(file: File) = new String(Files.readAllBytes(file.toPath), "UTF-8")

