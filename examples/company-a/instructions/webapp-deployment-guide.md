---
title: "WebApp Deployment Guide for Acme Corp"
tags: ["webapp", "deployment", "production", "best-practices", "security"]
category: "deployment"
priority: 1
---

# WebApp Deployment Guide for Acme Corp

## Overview

This guide covers the complete process for deploying WebApp resources in Acme Corp's Kubernetes infrastructure. Our WebApp CRD simplifies the deployment of web applications while enforcing security and operational best practices.

## Prerequisites

### Infrastructure Requirements
- Kubernetes cluster version 1.20+
- WebApp CRD installed (`kubectl apply -f crds/webapp-crd.yaml`)
- Proper RBAC permissions for target namespace
- Container registry access (registry.acme.io)

### Security Requirements
- All production images must be scanned and approved
- Images must come from approved registries only
- Non-root containers are mandatory for production

## Deployment Environments

### Development Environment
For rapid development and testing:

```yaml
# See sample files in the samples/ directory for complete examples
```

**Development Guidelines:**
- Use minimal resource requests
- Single replica is acceptable
- `latest` tags allowed for rapid iteration
- Monitoring is optional but recommended

### Staging Environment
For pre-production testing:

```yaml
# See sample files in the samples/ directory for complete examples
```

**Staging Guidelines:**
- Must use specific version tags
- Minimum 2 replicas for load testing
- Resource limits are required
- Monitoring must be enabled

### Production Environment
For live production workloads:

```yaml
# See sample files in the samples/ directory for complete examples
```

## Configuration Best Practices

### Resource Management
- **CPU Requests**: Start with 100m for development, 500m+ for production
- **Memory Requests**: Start with 128Mi for development, 512Mi+ for production
- **Limits**: Set limits to 2x requests as a starting point
- **Scaling**: Enable for production workloads with appropriate min/max

### Security Configuration
```yaml
security:
  runAsNonRoot: true              # Mandatory for production
  readOnlyRootFilesystem: true    # Recommended for production
  allowedRegistries:              # Restrict image sources
    - "registry.acme.io"
    - "docker.io/library"         # Only for base images
```

### Monitoring Setup
```yaml
monitoring:
  enabled: true                   # Required for all environments
  port: 8080                     # Standard metrics port
  path: "/metrics"               # Prometheus-compatible endpoint
```

## Domain and SSL Configuration

### Domain Naming Convention
- **Development**: `{app-name}.dev.acme.io`
- **Staging**: `{app-name}.staging.acme.io`
- **Production**: `{app-name}.acme.com`

### SSL Certificates
SSL is automatically provisioned for all domains using Let's Encrypt. Custom certificates can be configured through annotations.

## Deployment Process

### Step 1: Prepare Your Application
```bash
# Build and tag your container image
docker build -t registry.acme.io/my-app:v1.2.3 .

# Push to Acme registry
docker push registry.acme.io/my-app:v1.2.3
```

### Step 2: Create WebApp Manifest
```bash
# Copy appropriate template
cp samples/webapp-production.yaml my-app.yaml

# Edit configuration
vi my-app.yaml
```

### Step 3: Deploy
```bash
# Apply the WebApp resource
kubectl apply -f my-app.yaml

# Verify deployment
kubectl get webapps -n production
kubectl describe webapp my-app -n production
```

### Step 4: Monitor Deployment
```bash
# Check status
kubectl get webapp my-app -n production -o yaml

# View events
kubectl get events -n production --field-selector involvedObject.name=my-app

# Check pods
kubectl get pods -l app=my-app -n production
```

## Scaling and Performance

### Horizontal Pod Autoscaling
Enable automatic scaling for production workloads:

```yaml
scaling:
  enabled: true
  minReplicas: 3      # Minimum for HA
  maxReplicas: 20     # Adjust based on capacity
  targetCPU: 70       # Scale when CPU exceeds 70%
```

### Performance Optimization
- **CPU**: Monitor actual usage and adjust requests/limits
- **Memory**: Watch for memory leaks and OOM kills
- **Networking**: Consider connection pooling and keep-alive settings

## Troubleshooting

### Common Issues

#### 1. ImagePullBackOff
```bash
# Check image exists and is accessible
docker pull registry.acme.io/my-app:v1.2.3

# Verify registry credentials
kubectl get secrets -n production | grep regcred

# Check events for detailed error
kubectl describe pod <pod-name> -n production
```

#### 2. CrashLoopBackOff
```bash
# Check application logs
kubectl logs -l app=my-app -n production --previous

# Verify resource limits
kubectl describe webapp my-app -n production

# Check health endpoint
kubectl port-forward svc/my-app 8080:80 -n production
curl http://localhost:8080/health
```

#### 3. SSL Certificate Issues
```bash
# Check certificate status
kubectl describe webapp my-app -n production | grep -i certificate

# Verify DNS resolution
nslookup my-app.acme.com

# Check ingress configuration
kubectl get ingress -n production
```

### Useful Commands

```bash
# List all WebApps
kubectl get webapps --all-namespaces

# Get WebApp details
kubectl describe webapp my-app -n production

# Check WebApp logs
kubectl logs -l app=my-app -n production -f

# Scale WebApp manually
kubectl patch webapp my-app -n production -p '{"spec":{"replicas":10}}'

# Check WebApp status
kubectl get webapp my-app -n production -o jsonpath='{.status.phase}'

# View WebApp URL
kubectl get webapp my-app -n production -o jsonpath='{.status.url}'
```

## Monitoring and Alerting

### Metrics
All WebApps expose metrics at `/metrics` endpoint:
- Request rate and latency
- Error rates (4xx, 5xx)
- Resource utilization
- Custom application metrics

### Alerts
Standard alerts are automatically configured for:
- High error rate (>5% for 5 minutes)
- High latency (>1s p95 for 5 minutes)
- High CPU usage (>80% for 10 minutes)
- High memory usage (>90% for 5 minutes)

## Security Considerations

### Container Security
- Use minimal base images (Alpine, Distroless)
- Run as non-root user
- Enable read-only root filesystem when possible
- Regular security scanning of images

### Network Security
- Use network policies to restrict traffic
- Enable SSL/TLS for all external communications
- Implement proper authentication and authorization

### Secrets Management
- Use Kubernetes secrets for sensitive data
- Rotate secrets regularly
- Never embed secrets in container images

## Contact and Support

For questions or issues:
- **Platform Team**: platform-team@acme.io
- **Slack**: #platform-support
- **Documentation**: https://docs.acme.io/platform/webapp
- **Runbooks**: https://runbooks.acme.io/webapp

## Sample Files Reference

For complete, production-ready examples, please refer to the sample files in the `samples/` directory:

- `samples/webapp-simple.yaml` - Basic development configuration
- `samples/webapp-production.yaml` - Production-ready configuration with full features
