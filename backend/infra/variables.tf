# Project Configuration
variable "project_id" {
  description = "The GCP project ID"
  type        = string
}

variable "region" {
  description = "The GCP region for resources"
  type        = string
  default     = "us-east1"
}

# Service Configuration
variable "service_name" {
  description = "Name of the Cloud Run service"
  type        = string
  default     = "api-service"
}

variable "artifact_registry_repo_id" {
  description = "Artifact Registry repository ID"
  type        = string
  default     = "api-service-repo"
}

# Application Configuration
variable "log_level" {
  description = "Application log level"
  type        = string
  default     = "INFO"
}

# Cloud Run Resource Configuration
variable "min_instances" {
  description = "Minimum number of Cloud Run instances"
  type        = number
  default     = 0
}

variable "max_instances" {
  description = "Maximum number of Cloud Run instances"
  type        = number
  default     = 10
}

variable "cpu_limit" {
  description = "CPU limit for Cloud Run service"
  type        = string
  default     = "1"
}

variable "memory_limit" {
  description = "Memory limit for Cloud Run service"
  type        = string
  default     = "2Gi"
}

# AI Service API Keys
variable "gemini_api_key" {
  description = "Gemini API key for Google GenAI"
  type        = string
  sensitive   = true
}

variable "cohere_api_key" {
  description = "Cohere API key for rerank service"
  type        = string
  sensitive   = true
}

# Qdrant Cloud Configuration
variable "qdrant_url" {
  description = "Managed Qdrant Cloud endpoint (e.g. https://YOUR-CLUSTER.cloud.qdrant.io:6333)"
  type        = string
  sensitive   = true
}

variable "qdrant_api_key" {
  description = "API key for Qdrant Cloud instance"
  type        = string
  sensitive   = true
}

# Hugging Face Inference API
variable "hf_api_token" {
  description = "Hugging Face API token for hosted inference endpoints"
  type        = string
  sensitive   = true
} 