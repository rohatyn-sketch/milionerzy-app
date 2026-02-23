resource "google_storage_bucket" "functions_source" {
  project       = var.project_id
  name          = "${var.project_id}-functions-source"
  location      = var.region
  force_destroy = false

  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }
}

resource "google_storage_bucket" "uploads" {
  project       = var.project_id
  name          = "${var.project_id}-uploads"
  location      = var.region
  force_destroy = false

  uniform_bucket_level_access = true

  cors {
    origin          = ["*"]
    method          = ["GET", "PUT", "POST"]
    response_header = ["Content-Type"]
    max_age_seconds = 3600
  }
}
