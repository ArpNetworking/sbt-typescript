addSbtPlugin("com.arpnetworking" % "sbt-typescript" % sys.props("project.version"))

addSbtPlugin("com.typesafe.play" % "sbt-plugin" % "2.6.6")

resolvers ++= Seq(
  Resolver.mavenLocal,
  Resolver.url("sbt snapshot plugins", url("http://repo.scala-sbt.org/scalasbt/sbt-plugin-snapshots"))(Resolver.ivyStylePatterns),
  Resolver.sonatypeRepo("snapshots"),
  "Typesafe repository" at "http://repo.typesafe.com/typesafe/releases/",
  "Typesafe Snapshots Repository" at "http://repo.typesafe.com/typesafe/snapshots/"
)
