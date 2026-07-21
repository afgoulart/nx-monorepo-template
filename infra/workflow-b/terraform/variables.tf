variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "workflow_name" {
  type    = string
  default = "workflow-b"
}

variable "environment" {
  type    = string
  default = "dev"
}

variable "lambda_runtime" {
  type    = string
  default = "dotnet8"
}

variable "assembly_name" {
  description = ".NET assembly name of the workflow app."
  type        = string
  default     = "Acme.WorkflowB"
}

variable "handler_namespace" {
  description = "Namespace that contains the handler classes."
  type        = string
  default     = "Acme.WorkflowB.Handlers"
}

variable "lambda_artifact_path" {
  description = "Path to the packaged Lambda .zip produced by `dotnet lambda package` / publish."
  type        = string
  default     = "../../../dist/apps/workflow-b/lambda.zip"
}

variable "lambda_memory_mb" {
  type    = number
  default = 256
}

variable "lambda_timeout_s" {
  type    = number
  default = 30
}
