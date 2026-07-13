# Shared infrastructure keeps its own isolated state key. Workflows read from it
# via `terraform_remote_state`, but never write to it.
terraform {
  backend "s3" {
    bucket         = "REPLACE_ME-terraform-state"      # TODO: create this S3 bucket
    key            = "shared-infra/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "REPLACE_ME-terraform-locks"      # TODO: create this lock table
    encrypt        = true
  }
}
