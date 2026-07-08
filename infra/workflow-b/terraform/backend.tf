terraform {
  backend "s3" {
    bucket  = "nx-monorepo-template-workflow-b-state"
    key     = "workflow-b/terraform.tfstate"
    region  = "us-east-1"
    encrypt = true
  }
}
