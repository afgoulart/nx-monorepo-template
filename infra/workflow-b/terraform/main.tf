terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Workflow  = var.workflow_name
      Env       = var.environment
      ManagedBy = "terraform"
    }
  }
}

# Shared infrastructure (VPC, event topic, log groups) is provisioned separately
# in infra/shared-infra and consumed here via its remote state.
data "terraform_remote_state" "shared" {
  backend = "s3"
  config = {
    bucket = "REPLACE_ME-terraform-state" # TODO: same bucket as backend.tf
    key    = "shared-infra/terraform.tfstate"
    region = var.aws_region
  }
}

locals {
  name_prefix = "${var.workflow_name}-${var.environment}"

  # One Lambda per workflow step. The handler string follows the .NET Lambda
  # format: "<Assembly>::<Namespace>.<Class>::<Method>".
  handlers = {
    receive-event = "${var.assembly_name}::${var.handler_namespace}.ReceiveEventHandler::Handle"
    validate      = "${var.assembly_name}::${var.handler_namespace}.ValidateHandler::Handle"
    manual-review = "${var.assembly_name}::${var.handler_namespace}.ManualReviewHandler::Handle"
    finalize      = "${var.assembly_name}::${var.handler_namespace}.FinalizeHandler::Handle"
  }
}
