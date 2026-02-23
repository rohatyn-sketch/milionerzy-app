resource "google_identity_platform_config" "default" {
  provider = google-beta
  project  = var.project_id

  sign_in {
    allow_duplicate_emails = false
    anonymous { enabled = false }
    email { enabled = false; password_required = false }
  }
}

resource "google_identity_platform_default_supported_idp_config" "google" {
  provider      = google-beta
  project       = var.project_id
  idp_id        = "google.com"
  client_id     = ""
  client_secret = ""
  enabled       = true
  depends_on    = [google_identity_platform_config.default]
}
