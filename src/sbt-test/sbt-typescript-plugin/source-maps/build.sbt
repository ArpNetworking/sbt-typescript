import java.io.File
import java.nio.file.Files
import play.api.libs.json._
import sbt.complete.DefaultParsers._

lazy val root = (project in file(".")).enablePlugins(SbtWeb).settings(
  TypescriptKeys.sourceMap := true
)

lazy val checkSourceEquals = inputKey[Unit]("Validates source map source. First arg: source map path. Second arg: source file path.")

checkSourceEquals := {
  val args: Seq[String] = spaceDelimited("<arg>").parsed
  val actual = readSourceMapSource(new File(args(0)))
  val expected = args(1)
  assert(actual == expected, s"Invalid map source.\n Expected '$expected'.\n Actual: '$actual'.")
}

def readSourceMapSource(file: File) = {
  val text = readAllText(file)
  val json = Json.parse(text)
  (json \ "sources")(0).as[String]
}

def readAllText(file: File) =
  new String(Files.readAllBytes(file.toPath), "UTF-8")