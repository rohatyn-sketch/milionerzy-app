resource "google_service_account" "functions" {
  project      = var.project_id
  account_id   = "milionerzy-functions"
  display_name = "Milionerzy Cloud Functions"
}

# The actual Cloud Function is deployed via Firebase CLI (firebase deploy --only functions)
# Terraform only manages the service account and IAM bindings.
