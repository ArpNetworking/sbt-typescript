import java.io.File
import java.nio.file.Files
import com.arpnetworking.sbt.typescript.Import.TypescriptKeys._
import com.typesafe.sbt.web.SbtWeb
import sbt.complete.DefaultParsers._

scalaVersion := "2.11.8"

lazy val root = (project in file(".")).enablePlugins(SbtWeb).settings(
  JsEngineKeys.engineType := JsEngineKeys.EngineType.Node
)

libraryDependencies ++= Seq(
  "org.webjars.npm" % "rxjs" % "5.5.5",
  "org.webjars.npm" % "angular__core" % "2.0.0-rc.4"
)
