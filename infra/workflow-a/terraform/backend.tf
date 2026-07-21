# Isolated remote state per workflow.
#
# Each workflow keeps its state under its own key prefix in a shared S3 bucket,
# so workflows can be planned/applied independently without ever touching each
# other's state. Fill in the placeholders (or pass them via `-backend-config`)
# before running `terraform init`.
terraform {
  backend "s3" {
    bucket         = "REPLACE_ME-terraform-state"    # TODO: create this S3 bucket
    key            = "workflow-a/terraform.tfstate"  # isolated prefix per workflow
    region         = "us-east-1"
    dynamodb_table = "REPLACE_ME-terraform-locks"    # TODO: create this lock table
    encrypt        = true
  }
}
