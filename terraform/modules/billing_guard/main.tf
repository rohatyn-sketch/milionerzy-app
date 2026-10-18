# Billing backstop for AI spend.
#
# The app-level ledger (packages/backend/src/spend) is the primary, real-time
# guard. This module is the second line of defence for anything the ledger
# cannot see (a leaked API key, a bug that bypasses the choke point, pricing
# changes). Billing data lags by hours, so it is a backstop, not a cap.
#
#   Cloud Billing budget (monthly, both projects)
#        │ alerts at 50% / 90% / 100% (+ forecast 100%) to billing admins by email
#        │ and every update to Pub/Sub
#        ▼
#   Pub/Sub topic "ai-budget-alerts"
#        ▼
#   Cloud Function "ai-budget-kill-switch" — when cost >= budget x kill_at_ratio:
#        1. sets Firestore config/spend.aiEnabled = false   (app refuses AI calls)
#        2. disables generativelanguage.googleapis.com in the Gemini project
#           (stops the API key everywhere, even outside this app)
#
# Everything is behind var.enabled (default false) so merging this does not
# change live infrastructure until the owner has done the manual prerequisites.

locals {
  count = var.enabled ? 1 : 0
}

resource "google_project_service" "apis" {
  for_each = var.enabled ? toset([
    "billingbudgets.googleapis.com",
    "cloudfunctions.googleapis.com",
    "cloudbuild.googleapis.com",
    "eventarc.googleapis.com",
    "pubsub.googleapis.com",
    "serviceusage.googleapis.com",
  ]) : toset([])

  project            = var.project_id
  service            = each.value
  disable_on_destroy = false
}

resource "google_pubsub_topic" "budget_alerts" {
  count   = local.count
  project = var.project_id
  name    = "ai-budget-alerts"

  depends_on = [google_project_service.apis]
}

# Cloud Billing publishes budget notifications as this Google-managed account.
resource "google_pubsub_topic_iam_member" "billing_publisher" {
  count   = local.count
  project = var.project_id
  topic   = google_pubsub_topic.budget_alerts[0].name
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:billing-budget-alert@system.gserviceaccount.com"
}

resource "google_billing_budget" "ai_monthly" {
  count           = local.count
  billing_account = var.billing_account_id
  display_name    = "EduFiszka AI monthly budget"

  budget_filter {
    # Gemini is billed to the AI Studio project, TTS/Cloud Run to the app project.
    projects        = ["projects/${var.app_project_number}", "projects/${var.gemini_project_number}"]
    calendar_period = "MONTH"
  }

  amount {
    specified_amount {
      currency_code = var.budget_currency
      units         = tostring(floor(var.budget_amount))
    }
  }

  threshold_rules {
    threshold_percent = 0.5
  }
  threshold_rules {
    threshold_percent = 0.9
  }
  threshold_rules {
    threshold_percent = 1.0
  }
  threshold_rules {
    threshold_percent = 1.0
    spend_basis       = "FORECASTED_SPEND"
  }

  all_updates_rule {
    pubsub_topic   = google_pubsub_topic.budget_alerts[0].id
    schema_version = "1.0"
    # Keep the default e-mails to billing admins/users.
    disable_default_iam_recipients = false
  }

  depends_on = [google_pubsub_topic_iam_member.billing_publisher]
}

# --- Kill-switch function ---------------------------------------------------

resource "google_service_account" "kill_switch" {
  count        = local.count
  project      = var.project_id
  account_id   = "ai-budget-kill-switch"
  display_name = "AI budget kill switch"
}

# Write config/spend in Firestore.
resource "google_project_iam_member" "kill_switch_datastore" {
  count   = local.count
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.kill_switch[0].email}"
}

# Disable the Gemini API in the AI Studio project. Requires the identity that
# runs Terraform to be allowed to set IAM on that project (manual prerequisite).
resource "google_project_iam_member" "kill_switch_serviceusage" {
  count   = var.enabled && var.kill_mode == "disable_api" ? 1 : 0
  project = var.gemini_project_id
  role    = "roles/serviceusage.serviceUsageAdmin"
  member  = "serviceAccount:${google_service_account.kill_switch[0].email}"
}

# Eventarc delivers Pub/Sub messages by invoking the function's Cloud Run service.
resource "google_project_iam_member" "kill_switch_invoker" {
  count   = local.count
  project = var.project_id
  role    = "roles/run.invoker"
  member  = "serviceAccount:${google_service_account.kill_switch[0].email}"
}

resource "google_project_iam_member" "kill_switch_event_receiver" {
  count   = local.count
  project = var.project_id
  role    = "roles/eventarc.eventReceiver"
  member  = "serviceAccount:${google_service_account.kill_switch[0].email}"
}

data "archive_file" "kill_switch" {
  count       = local.count
  type        = "zip"
  source_dir  = "${path.module}/function"
  output_path = "${path.root}/.terraform/tmp/ai-budget-kill-switch.zip"
}

resource "google_storage_bucket_object" "kill_switch" {
  count  = local.count
  bucket = var.functions_source_bucket
  name   = "ai-budget-kill-switch/${data.archive_file.kill_switch[0].output_md5}.zip"
  source = data.archive_file.kill_switch[0].output_path
}

resource "google_cloudfunctions2_function" "kill_switch" {
  count    = local.count
  project  = var.project_id
  location = var.region
  name     = "ai-budget-kill-switch"

  build_config {
    runtime     = "nodejs20"
    entry_point = "budgetKillSwitch"
    source {
      storage_source {
        bucket = var.functions_source_bucket
        object = google_storage_bucket_object.kill_switch[0].name
      }
    }
  }

  service_config {
    max_instance_count    = 1
    available_memory      = "256M"
    timeout_seconds       = 60
    service_account_email = google_service_account.kill_switch[0].email
    environment_variables = {
      APP_PROJECT_ID    = var.project_id
      GEMINI_PROJECT_ID = var.gemini_project_id
      KILL_AT_RATIO     = tostring(var.kill_at_ratio)
      KILL_MODE         = var.kill_mode
    }
  }

  event_trigger {
    trigger_region        = var.region
    event_type            = "google.cloud.pubsub.topic.v1.messagePublished"
    pubsub_topic          = google_pubsub_topic.budget_alerts[0].id
    retry_policy          = "RETRY_POLICY_RETRY"
    service_account_email = google_service_account.kill_switch[0].email
  }

  depends_on = [
    google_project_service.apis,
    google_project_iam_member.kill_switch_invoker,
    google_project_iam_member.kill_switch_event_receiver,
  ]
}
