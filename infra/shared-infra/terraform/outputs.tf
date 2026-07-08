output "vpc_id" {
  value = aws_vpc.main.id
}

output "event_bus_name" {
  value = aws_cloudwatch_event_bus.shared_events.name
}
