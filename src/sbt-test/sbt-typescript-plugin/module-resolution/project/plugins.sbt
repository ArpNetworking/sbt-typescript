addSbtPlugin("com.arpnetworking" % "sbt-typescript" % sys.props("project.version"))

addSbtPlugin("com.typesafe.play" % "sbt-plugin" % "2.8.2")

resolvers ++= Seq(
  Resolver.mavenLocal,
  Resolver.mavenCentral,
  Resolver.url("sbt snapshot plugins", url("https://repo.scala-sbt.org/scalasbt/sbt-plugin-snapshots"))(Resolver.ivyStylePatterns),
  Resolver.sonatypeRepo("snapshots"),
  "Typesafe repository" at "https://repo.typesafe.com/typesafe/releases/",
  "Typesafe Snapshots Repository" at "https://repo.typesafe.com/typesafe/snapshots/"
)
