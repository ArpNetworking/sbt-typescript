import com.arpnetworking.sbt.typescript.Import.TypescriptKeys._

lazy val root = (project in file(".")).enablePlugins(SbtWeb).settings(
  JsEngineKeys.engineType := JsEngineKeys.EngineType.Node
)
