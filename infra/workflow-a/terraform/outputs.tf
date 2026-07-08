output "workflow_a_queue_arn" {
  value = aws_sqs_queue.workflow_events.arn
}

output "workflow_a_lambda_name" {
  value = aws_lambda_function.workflow_handler.function_name
}
