variable "project_id" {
  type        = string
  description = "GCP project ID"
}

variable "region" {
  type        = string
  default     = "europe-central2"
  description = "GCP region"
}

variable "gemini_api_key" {
  type        = string
  sensitive   = true
  description = "Gemini API key"
}

variable "google_client_id" {
  type        = string
  description = "Google OAuth 2.0 Client ID"
}

variable "google_client_secret" {
  type        = string
  sensitive   = true
  description = "Google OAuth 2.0 Client Secret"
}
