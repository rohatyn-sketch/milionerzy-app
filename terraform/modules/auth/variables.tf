variable "project_id" { type = string }

variable "google_client_id" {
  type        = string
  description = "Google OAuth 2.0 Client ID"
}

variable "google_client_secret" {
  type        = string
  sensitive   = true
  description = "Google OAuth 2.0 Client Secret"
}
