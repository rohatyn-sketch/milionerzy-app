resource "google_firestore_database" "default" {
  provider    = google-beta
  project     = var.project_id
  name        = "(default)"
  location_id = var.region
  type        = "FIRESTORE_NATIVE"
}

resource "google_firebaserules_ruleset" "firestore" {
  provider = google-beta
  project  = var.project_id
  source {
    files {
      name    = "firestore.rules"
      content = file("${path.root}/../firestore.rules")
    }
  }
  depends_on = [google_firestore_database.default]
}

resource "google_firebaserules_release" "firestore" {
  provider     = google-beta
  project      = var.project_id
  name         = "cloud.firestore"
  ruleset_name = google_firebaserules_ruleset.firestore.name
  depends_on   = [google_firebaserules_ruleset.firestore]
}

resource "google_firestore_index" "leaderboard_score" {
  provider   = google-beta
  project    = var.project_id
  database   = google_firestore_database.default.name
  collection = "leaderboard"

  fields {
    field_path = "score"
    order      = "DESCENDING"
  }

  fields {
    field_path = "date"
    order      = "DESCENDING"
  }
}
