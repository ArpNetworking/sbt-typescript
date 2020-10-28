libraryDependencies += { "org.scala-sbt" %% "scripted-plugin" % sbtVersion.value }

resolvers += Resolver.typesafeRepo("releases")

addSbtPlugin("com.arpnetworking" % "sbt-typescript" % "0.4.4")

addSbtPlugin("com.github.gseitz" % "sbt-release" % "1.0.8")

addSbtPlugin("org.xerial.sbt" % "sbt-sonatype" % "2.3")

addSbtPlugin("com.jsuereth" % "sbt-pgp" % "1.1.0")

