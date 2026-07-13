# IAM role scoped to just this workflow. Each workflow owns its own role so a
# permission change in one workflow can never widen another's access.
resource "aws_iam_role" "lambda" {
  name = "${local.name_prefix}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

# Minimal inline policy: write this workflow's logs and consume its own queue.
resource "aws_iam_role_policy" "lambda" {
  name = "${local.name_prefix}-lambda-policy"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "Logs"
        Effect   = "Allow"
        Action   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "arn:aws:logs:${var.aws_region}:*:log-group:/aws/lambda/${local.name_prefix}-*:*"
      },
      {
        Sid      = "ConsumeQueue"
        Effect   = "Allow"
        Action   = ["sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:GetQueueAttributes"]
        Resource = aws_sqs_queue.ingress.arn
      }
    ]
  })
}

# One Lambda function per workflow step, all sharing the same deployment package.
resource "aws_lambda_function" "step" {
  for_each = local.handlers

  function_name = "${local.name_prefix}-${each.key}"
  role          = aws_iam_role.lambda.arn
  runtime       = var.lambda_runtime
  handler       = each.value
  memory_size   = var.lambda_memory_mb
  timeout       = var.lambda_timeout_s

  filename         = var.lambda_artifact_path
  source_code_hash = filebase64sha256(var.lambda_artifact_path)

  environment {
    variables = {
      WORKFLOW_NAME = var.workflow_name
      ENVIRONMENT   = var.environment
      LOG_LEVEL     = "info"
    }
  }
}

# The ingress queue triggers the "receive-event" step; the rest of the steps are
# invoked by the workflow orchestration (e.g. Step Functions) — out of scope for
# this template.
resource "aws_lambda_event_source_mapping" "ingress" {
  event_source_arn = aws_sqs_queue.ingress.arn
  function_name    = aws_lambda_function.step["receive-event"].arn
  batch_size       = 10
}
