output "gemini_secret_id" {
  value = google_secret_manager_secret.gemini_api_key.secret_id
}
