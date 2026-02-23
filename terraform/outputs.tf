output "firebase_web_app_config" {
  value = module.firebase.web_app_config
}

output "function_url" {
  value = module.functions.function_url
}

output "hosting_site" {
  value = module.hosting.default_url
}
