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

variable "github_org" {
  type        = string
  default     = "rohatyn-sketch"
  description = "GitHub organization or user"
}

variable "github_repo" {
  type        = string
  default     = "milionerzy-app"
  description = "GitHub repository name"
}

# --- AI spend backstop (modules/billing_guard) ------------------------------

variable "enable_billing_guard" {
  type        = bool
  default     = false
  description = "Create the monthly billing budget and kill switch. Requires manual IAM prerequisites first."
}

variable "billing_account_id" {
  type        = string
  default     = "01D2D7-34EDF2-9F0220"
  description = "Billing account paying for the app and Gemini projects."
}

variable "app_project_number" {
  type        = string
  default     = "577769856938"
  description = "Project number of milionerzy-487910."
}

variable "gemini_project_id" {
  type        = string
  default     = "gen-lang-client-0089604349"
  description = "AI Studio project that owns the Gemini API key used by the backend."
}

variable "gemini_project_number" {
  type        = string
  default     = "493666783968"
  description = "Project number of the Gemini project."
}

variable "ai_budget_amount" {
  type        = number
  default     = 300
  description = "Monthly budget in the billing account currency (PLN). ~US$80."
}

variable "ai_budget_currency" {
  type    = string
  default = "PLN"
}

variable "ai_budget_kill_mode" {
  type        = string
  default     = "disable_api"
  description = "dry_run | app_only | disable_api"
}
