output "web_app_config" {
  value = {
    api_key             = data.google_firebase_web_app_config.default.api_key
    auth_domain         = "${var.project_id}.firebaseapp.com"
    project_id          = var.project_id
    storage_bucket      = "${var.project_id}.appspot.com"
    messaging_sender_id = data.google_firebase_web_app_config.default.messaging_sender_id
    app_id              = google_firebase_web_app.default.app_id
  }
}
