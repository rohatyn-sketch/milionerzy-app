output "service_account_email" {
  value = google_service_account.cloud_run.email
}

output "github_actions_sa_email" {
  value = google_service_account.github_actions.email
}

output "workload_identity_provider" {
  value = google_iam_workload_identity_pool_provider.github.name
}

output "artifact_registry_url" {
  value = "${var.region}-docker.pkg.dev/${var.project_id}/milionerzy-docker"
}
