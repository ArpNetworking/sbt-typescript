libraryDependencies <+= (sbtVersion) { sv =>
  "org.scala-sbt" % "scripted-plugin" % sv
}

resolvers += Resolver.typesafeRepo("releases")

