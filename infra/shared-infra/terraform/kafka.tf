# Shared event backbone: a single MSK Serverless cluster that hosts the one
# topic every workflow publishes to and consumes from. The shared-event-client
# library routes messages from this topic to the correct workflow.
#
# MSK Serverless is used for a low-ops default; swap for a provisioned
# aws_msk_cluster if you need finer control over broker sizing.
resource "aws_msk_serverless_cluster" "events" {
  cluster_name = "workflows-${var.environment}"

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.events.id]
  }

  client_authentication {
    sasl {
      iam {
        enabled = true
      }
    }
  }
}

# The topic itself ("workflows.events") is created by the application/consumer on
# first connect, or by a bootstrap job. Its logical name is exported so workflows
# and CI can reference it consistently.
output "events_topic_name" {
  value = "workflows.events"
}

output "events_bootstrap_brokers" {
  value = aws_msk_serverless_cluster.events.bootstrap_brokers_sasl_iam
}
