import java.io.File
import java.nio.file.Files
import com.arpnetworking.sbt.typescript.Import.TypescriptKeys._
import com.typesafe.sbt.web.SbtWeb
import sbt.complete.DefaultParsers._


lazy val root = (project in file(".")).enablePlugins(SbtWeb).settings(
  JsEngineKeys.engineType := JsEngineKeys.EngineType.Node
)

lazy val assertContainsText = inputKey[Unit]("")

assertContainsText := {
  val args: Seq[String] = spaceDelimited("<arg>").parsed
  containsString(args(0), args(1))
}

def containsString(fileName: String, text: String) = {
  val actual = readAllText(new File(fileName))
  assert(actual.contains(text), "error")
}


def readAllText(file: File) = {
  new String(Files.readAllBytes(file.toPath), "UTF-8")
}
