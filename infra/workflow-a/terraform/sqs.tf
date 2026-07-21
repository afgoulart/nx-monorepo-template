# Per-workflow ingress queue with a dead-letter queue. Isolating the queue per
# workflow keeps back-pressure and poison messages contained to one workflow.
resource "aws_sqs_queue" "ingress_dlq" {
  name                      = "${local.name_prefix}-ingress-dlq"
  message_retention_seconds = 1209600 # 14 days
}

resource "aws_sqs_queue" "ingress" {
  name                       = "${local.name_prefix}-ingress"
  visibility_timeout_seconds = var.lambda_timeout_s * 6
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.ingress_dlq.arn
    maxReceiveCount     = 5
  })
}

output "ingress_queue_url" {
  value = aws_sqs_queue.ingress.url
}

output "lambda_function_names" {
  value = { for k, fn in aws_lambda_function.step : k => fn.function_name }
}
