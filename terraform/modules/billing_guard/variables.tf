variable "enabled" {
  type        = bool
  default     = false
  description = "Create the billing backstop. Off by default: it needs manual IAM grants to github-deployer first (see ARCHITECTURE.md, AI Spend Protection)."
}

variable "project_id" {
  type        = string
  description = "Project that hosts the backend, Firestore, the Pub/Sub topic and the kill-switch function."
}

variable "region" {
  type = string
}

variable "billing_account_id" {
  type        = string
  description = "Billing account that pays for both projects, e.g. 01D2D7-34EDF2-9F0220."
}

variable "app_project_number" {
  type        = string
  description = "Project NUMBER of the app project (Cloud Run, TTS, Firestore)."
}

variable "gemini_project_id" {
  type        = string
  description = "Project that owns the Gemini API key (an AI Studio 'gen-lang-client-…' project). Gemini charges are billed to THIS project, not the app project."
}

variable "gemini_project_number" {
  type        = string
  description = "Project NUMBER of the Gemini project."
}

variable "budget_amount" {
  type        = number
  default     = 300
  description = "Monthly budget in the billing account's currency. The account is billed in PLN, so this is PLN (~US$80 at ~3.75 PLN/USD — adjust to the current rate)."
}

variable "budget_currency" {
  type        = string
  default     = "PLN"
  description = "Must equal the billing account currency."
}

variable "kill_at_ratio" {
  type        = number
  default     = 1.0
  description = "Kill switch fires when actual cost / budget reaches this ratio."
}

variable "kill_mode" {
  type        = string
  default     = "disable_api"
  description = "dry_run = log only; app_only = set Firestore config/spend.aiEnabled=false; disable_api = app_only + disable generativelanguage.googleapis.com in the Gemini project."

  validation {
    condition     = contains(["dry_run", "app_only", "disable_api"], var.kill_mode)
    error_message = "kill_mode must be dry_run, app_only or disable_api."
  }
}

variable "functions_source_bucket" {
  type        = string
  description = "Existing GCS bucket for function source archives."
}
