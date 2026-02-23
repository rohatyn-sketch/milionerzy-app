resource "google_service_account" "functions" {
  project      = var.project_id
  account_id   = "milionerzy-functions"
  display_name = "Milionerzy Cloud Functions"
}

resource "google_cloudfunctions2_function" "api" {
  provider = google-beta
  project  = var.project_id
  name     = "api"
  location = var.region

  build_config {
    runtime     = "nodejs20"
    entry_point = "api"
    source {
      storage_source {
        bucket = var.source_bucket
        object = "functions-source.zip"
      }
    }
  }

  service_config {
    max_instance_count    = 10
    min_instance_count    = 0
    available_memory      = "512Mi"
    timeout_seconds       = 300
    service_account_email = google_service_account.functions.email

    secret_environment_variables {
      key        = "GEMINI_API_KEY"
      project_id = var.project_id
      secret     = var.gemini_secret_id
      version    = "latest"
    }
  }
}
