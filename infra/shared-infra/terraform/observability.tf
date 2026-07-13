# Shared observability primitives. Per-Lambda log groups are created by each
# workflow (implicitly by Lambda, or explicitly in its own stack); here we set
# up a shared retention policy resource and a cross-workflow dashboard.
resource "aws_cloudwatch_log_group" "platform" {
  name              = "/workflows/${var.environment}/platform"
  retention_in_days = var.log_retention_days
}

resource "aws_cloudwatch_dashboard" "workflows" {
  dashboard_name = "workflows-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "text"
        x      = 0
        y      = 0
        width  = 24
        height = 2
        properties = {
          markdown = "# Workflows platform (${var.environment})\nShared dashboard. Each workflow adds its own widgets/alarms in its stack."
        }
      }
    ]
  })
}

output "platform_log_group" {
  value = aws_cloudwatch_log_group.platform.name
}
