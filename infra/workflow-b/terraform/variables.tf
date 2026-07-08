variable "aws_region" {
  description = "Região AWS para recursos do workflow-b"
  type        = string
  default     = "us-east-1"
}

variable "lambda_artifact_bucket" {
  description = "Bucket S3 com artefato da Lambda"
  type        = string
}

variable "lambda_artifact_key" {
  description = "Chave S3 do artefato da Lambda"
  type        = string
}
