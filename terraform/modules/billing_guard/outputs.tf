output "budget_name" {
  value = var.enabled ? google_billing_budget.ai_monthly[0].name : null
}

output "alerts_topic" {
  value = var.enabled ? google_pubsub_topic.budget_alerts[0].id : null
}

output "kill_switch_function" {
  value = var.enabled ? google_cloudfunctions2_function.kill_switch[0].name : null
}
