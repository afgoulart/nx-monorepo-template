# Minimal VPC with private subnets across two AZs. This is where the shared
# event backbone (MSK) and the workflow Lambdas run.
data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = { Name = "workflows-${var.environment}" }
}

resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = { Name = "workflows-${var.environment}-private-${count.index}" }
}

resource "aws_security_group" "events" {
  name        = "workflows-${var.environment}-events"
  description = "Access to the shared event backbone"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

output "vpc_id" {
  value = aws_vpc.main.id
}

output "private_subnet_ids" {
  value = aws_subnet.private[*].id
}

output "events_security_group_id" {
  value = aws_security_group.events.id
}
