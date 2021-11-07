resource "random_id" "build" {
  byte_length = 6
}

resource "docker_image" "main" {
  name = "${local.project_name}-${local.environment_name}"
  build {
    path = "../"
    tag  = ["${aws_ecr_repository.main.repository_url}:${local.version}"]

    label = {
      author : "AgileSyndrome"
    }
  }
}

resource "null_resource" "docker_push" {
  provisioner "local-exec" {
    command = "docker push ${aws_ecr_repository.main.repository_url}:${local.version}"
  }
  triggers = {
    version = local.version
  }
  depends_on = [
    docker_image.main
  ]
}
