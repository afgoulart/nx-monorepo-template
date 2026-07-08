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

data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_sqs_queue" "workflow_events" {
  name = "workflow-b-events"
}

resource "aws_cloudwatch_event_bus" "workflow_bus" {
  name = "workflow-b-bus"
}

resource "aws_iam_role" "lambda_role" {
  name               = "workflow-b-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

resource "aws_iam_role_policy" "lambda_minimum_scope" {
  name = "workflow-b-lambda-minimum-scope"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.workflow_events.arn
      }
    ]
  })
}

resource "aws_lambda_function" "workflow_handler" {
  function_name = "workflow-b-handler"
  role          = aws_iam_role.lambda_role.arn
  handler       = "main.receiveEventHandler"
  runtime       = "nodejs24.x"

  s3_bucket = var.lambda_artifact_bucket
  s3_key    = var.lambda_artifact_key
}
