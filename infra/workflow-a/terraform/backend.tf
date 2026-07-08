terraform {
  backend "s3" {
    bucket  = "nx-monorepo-template-workflow-a-state"
    key     = "workflow-a/terraform.tfstate"
    region  = "us-east-1"
    encrypt = true
  }
}
