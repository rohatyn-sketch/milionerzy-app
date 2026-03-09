output "firebase_web_app_config" {
  value = module.firebase.web_app_config
}

output "functions_service_account" {
  value = module.functions.service_account_email
}

output "hosting_site" {
  value = module.hosting.default_url
}
