terraform {
  required_version = ">= 1.5.0"
  required_providers {
    google      = { source = "hashicorp/google", version = ">= 5.0" }
    google-beta = { source = "hashicorp/google-beta", version = ">= 5.0" }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

module "firebase" {
  source     = "./modules/firebase"
  project_id = var.project_id
}

module "firestore" {
  source     = "./modules/firestore"
  project_id = var.project_id
  region     = var.region
  depends_on = [module.firebase]
}

module "auth" {
  source               = "./modules/auth"
  project_id           = var.project_id
  google_client_id     = var.google_client_id
  google_client_secret = var.google_client_secret
  depends_on           = [module.firebase]
}

module "secrets" {
  source         = "./modules/secrets"
  project_id     = var.project_id
  gemini_api_key = var.gemini_api_key
}

module "storage" {
  source     = "./modules/storage"
  project_id = var.project_id
  region     = var.region
}

module "functions" {
  source           = "./modules/functions"
  project_id       = var.project_id
  region           = var.region
  source_bucket    = module.storage.functions_source_bucket
  gemini_secret_id = module.secrets.gemini_secret_id
  depends_on       = [module.firestore, module.secrets]
}

module "hosting" {
  source     = "./modules/hosting"
  project_id = var.project_id
  site_id    = "${var.project_id}-hosting"
  depends_on = [module.firebase]
}
