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

# Enable required APIs
resource "google_project_service" "apis" {
  for_each = toset([
    "run.googleapis.com",
    "artifactregistry.googleapis.com",
    "iamcredentials.googleapis.com",
    "iam.googleapis.com",
  ])
  project = var.project_id
  service = each.value

  disable_on_destroy = false
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

module "cloud_run" {
  source      = "./modules/functions"
  project_id  = var.project_id
  region      = var.region
  github_org  = var.github_org
  github_repo = var.github_repo
  depends_on  = [module.firestore, module.secrets, google_project_service.apis]
}

module "hosting" {
  source     = "./modules/hosting"
  project_id = var.project_id
  site_id    = "milionerzy"
  depends_on = [module.firebase]
}
