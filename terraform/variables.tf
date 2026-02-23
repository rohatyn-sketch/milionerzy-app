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
