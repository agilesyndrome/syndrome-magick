resource "aws_lambda_function" "lambda" {
  image_uri     = "${aws_ecr_repository.main.repository_url}:${local.version}"
  package_type  = "Image"
  function_name = local.lambda_function_name
  role          = aws_iam_role.lambda_role.arn
  memory_size   = local.lambda_memory_mb
  timeout       = local.timeout_seconds
  depends_on    = [
    null_resource.docker_push
  ]

  environment {
    variables = {
      Timeout = local.timeout_seconds
      Version = local.version
      Environment = local.environment_name
      Project = local.project_name
    }
  }
}