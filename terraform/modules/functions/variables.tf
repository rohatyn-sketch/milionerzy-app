variable "project_id" {
  type = string
}

variable "region" {
  type = string
}

variable "github_org" {
  type        = string
  description = "GitHub organization or user"
}

variable "github_repo" {
  type        = string
  description = "GitHub repository name"
}
