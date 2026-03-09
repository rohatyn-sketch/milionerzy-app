output "firebase_web_app_config" {
  value = module.firebase.web_app_config
}

output "cloud_run_service_account" {
  value = module.cloud_run.service_account_email
}

output "github_actions_sa_email" {
  value = module.cloud_run.github_actions_sa_email
}

output "workload_identity_provider" {
  value = module.cloud_run.workload_identity_provider
}

output "artifact_registry_url" {
  value = module.cloud_run.artifact_registry_url
}

output "hosting_site" {
  value = module.hosting.default_url
}
