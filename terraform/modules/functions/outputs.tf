output "function_url" {
  value = google_cloudfunctions2_function.api.service_config[0].uri
}

output "service_account_email" {
  value = google_service_account.functions.email
}
