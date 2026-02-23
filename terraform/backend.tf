terraform {
  backend "gcs" {
    bucket = "milionerzy-terraform-state"
    prefix = "state"
  }
}
