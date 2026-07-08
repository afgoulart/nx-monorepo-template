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
}

resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "workflow-platform-vpc"
  }
}

resource "aws_subnet" "private_a" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "${var.aws_region}a"

  tags = {
    Name = "workflow-platform-private-a"
  }
}

resource "aws_subnet" "private_b" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "${var.aws_region}b"

  tags = {
    Name = "workflow-platform-private-b"
  }
}

resource "aws_cloudwatch_event_bus" "shared_events" {
  name = "shared-workflow-events"
}

resource "aws_cloudwatch_log_group" "workflow_platform" {
  name              = "/aws/workflows/platform"
  retention_in_days = 30
}

resource "aws_xray_sampling_rule" "default_rule" {
  rule_name      = "workflow-platform-default"
  priority       = 10000
  version        = 1
  reservoir_size = 1
  fixed_rate     = 0.1
  host           = "*"
  http_method    = "*"
  service_name   = "*"
  service_type   = "*"
  resource_arn   = "*"
  url_path       = "*"
}
