# Cloud Run Service Outputs
output "service_url" {
  description = "URL of the deployed Cloud Run service"
  value       = google_cloud_run_v2_service.api_service.uri
}

output "service_name" {
  description = "Name of the Cloud Run service"
  value       = google_cloud_run_v2_service.api_service.name
}

output "service_location" {
  description = "Location of the Cloud Run service"
  value       = google_cloud_run_v2_service.api_service.location
}

# Artifact Registry Outputs
output "artifact_registry_repository_url" {
  description = "URL of the Artifact Registry repository"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${var.artifact_registry_repo_id}"
}

output "docker_image_url" {
  description = "Full Docker image URL for the service"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${var.artifact_registry_repo_id}/api-service:latest"
}

# Service Account Outputs
output "service_account_email" {
  description = "Email of the service account used by Cloud Run"
  value       = google_service_account.api_service_sa.email
}

# Build and Deploy Commands
output "build_command" {
  description = "Command to build and push the Docker image"
  value       = "gcloud builds submit --config=backend/service/api-service/cloudbuild.yaml --substitutions=_ARTIFACT_REGISTRY_REPO_ID=${var.artifact_registry_repo_id},_GCP_REGION=${var.region} backend/service/api-service/"
}

output "deploy_command" {
  description = "Command to deploy using gcloud (alternative to Terraform)"
  value       = "gcloud run deploy ${var.service_name} --image=${var.region}-docker.pkg.dev/${var.project_id}/${var.artifact_registry_repo_id}/api-service:latest --region=${var.region} --platform=managed"
} 