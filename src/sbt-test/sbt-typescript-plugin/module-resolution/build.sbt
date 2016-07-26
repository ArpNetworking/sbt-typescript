import java.io.File
import java.nio.file.Files
import com.arpnetworking.sbt.typescript.Import.TypescriptKeys._
import com.typesafe.sbt.web.SbtWeb
import sbt.complete.DefaultParsers._

scalaVersion := "2.11.8"

lazy val root = (project in file(".")).enablePlugins(SbtWeb, PlayScala).settings(
  JsEngineKeys.engineType := JsEngineKeys.EngineType.Node,
  moduleKind := "System",
  experimentalDecorators := true,
  emitDecoratorMetadata := true,
  moduleResolutionKind := "NodeJs",
  paths := Map("@angular/core" -> List("angular__core"))
)

libraryDependencies ++= Seq(
  "org.webjars.npm" % "rxjs" % "5.0.0-beta.10",
  "org.webjars.npm" % "angular__core" % "2.0.0-rc.4"
)

libraryDependencies ~= {
  _ map {
    case m if m.organization == "com.typesafe.play" =>
      m.exclude("commons-logging", "commons-logging")
        .exclude("org.slf4j", "jcl-over-slf4j")
    case m if m.organization == "com.rebuy" =>
      m.exclude("org.slf4j", "slf4j-log4j12")
    case m => m
  }
}
