output "workflow_b_queue_arn" {
  value = aws_sqs_queue.workflow_events.arn
}

output "workflow_b_lambda_name" {
  value = aws_lambda_function.workflow_handler.function_name
}
