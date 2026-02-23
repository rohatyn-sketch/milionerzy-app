output "functions_source_bucket" {
  value = google_storage_bucket.functions_source.name
}

output "uploads_bucket" {
  value = google_storage_bucket.uploads.name
}
