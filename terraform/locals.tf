locals {
  project_name = var.function_name
  environment_name = var.environment_name
  image_bucket = var.image_bucket
  version = jsondecode(file("../src/package.json")).version
  timeout_seconds = 90
  lambda_memory_mb = 1024
}

# Resource names, based on the values above
locals {
  iam_role_name = "${local.project_name}_${local.environment_name}_role"
  iam_policy_name = "${local.project_name}_${local.environment_name}_policy"
  lambda_function_name = "${local.project_name}-${local.environment_name}"
  ecr_repository_name = "${local.project_name}-${local.environment_name}"
}