# Configure the Google Cloud Provider
terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Enable required APIs
resource "google_project_service" "required_apis" {
  for_each = toset([
    "cloudbuild.googleapis.com",
    "run.googleapis.com",
    "artifactregistry.googleapis.com"
  ])
  
  service = each.value
  project = var.project_id
  
  disable_dependent_services = false
  disable_on_destroy        = false
}

# Create Artifact Registry repository
resource "google_artifact_registry_repository" "api_service_repo" {
  repository_id = var.artifact_registry_repo_id
  location      = var.region
  format        = "DOCKER"
  description   = "Docker repository for API Service"
  
  depends_on = [google_project_service.required_apis]
}

# Create service account for Cloud Run
resource "google_service_account" "api_service_sa" {
  account_id   = "api-service-sa"
  display_name = "API Service Account"
  description  = "Service account for API Service Cloud Run service"
}

# Grant necessary permissions to the service account
resource "google_project_iam_member" "logging_writer" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.api_service_sa.email}"
}

resource "google_project_iam_member" "monitoring_writer" {
  project = var.project_id
  role    = "roles/monitoring.metricWriter"
  member  = "serviceAccount:${google_service_account.api_service_sa.email}"
}

# Create Cloud Run service
resource "google_cloud_run_v2_service" "api_service" {
  name     = var.service_name
  location = var.region
  
  template {
    service_account = google_service_account.api_service_sa.email
    
    scaling {
      min_instance_count = var.min_instances
      max_instance_count = var.max_instances
    }
    
    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${var.artifact_registry_repo_id}/api-service:latest"
      
      ports {
        container_port = 8080
      }
      
      env {
        name  = "LOG_LEVEL"
        value = var.log_level
      }
      
      # Inject sensitive API keys via environment variables
      env {
        name  = "GEMINI_API_KEY"
        value = var.gemini_api_key
      }

      env {
        name  = "COHERE_API_KEY"
        value = var.cohere_api_key
      }

      env {
        name  = "QDRANT_URL"
        value = var.qdrant_url
      }

      env {
        name  = "QDRANT_API_KEY"
        value = var.qdrant_api_key
      }
      
      resources {
        limits = {
          cpu    = var.cpu_limit
          memory = var.memory_limit
        }
        cpu_idle = true
      }
      
      startup_probe {
        http_get {
          path = "/readiness"
          port = 8080
        }
        initial_delay_seconds = 15
        timeout_seconds       = 10
        period_seconds        = 10
        failure_threshold     = 5
      }
      
      liveness_probe {
        http_get {
          path = "/liveness"
          port = 8080
        }
        initial_delay_seconds = 60
        timeout_seconds       = 10
        period_seconds        = 60
        failure_threshold     = 3
      }
    }
  }
  
  traffic {
    percent = 100
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
  }
  
  depends_on = [
    google_project_service.required_apis,
    google_artifact_registry_repository.api_service_repo
  ]
}

# IAM policy to allow public access (adjust as needed for your security requirements)
resource "google_cloud_run_service_iam_member" "public_access" {
  location = google_cloud_run_v2_service.api_service.location
  service  = google_cloud_run_v2_service.api_service.name
  role     = "roles/run.invoker"
  member   = "allUsers"
} 