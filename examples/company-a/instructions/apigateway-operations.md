---
title: "API Gateway Operations Guide for Acme Corp"
tags: ["apigateway", "microservices", "routing", "security", "ssl", "monitoring"]
category: "networking"
priority: 2
---

# API Gateway Operations Guide for Acme Corp

## Overview

This guide covers the deployment, configuration, and operational procedures for API Gateway resources at Acme Corp. Our API Gateway CRD provides a unified ingress solution for microservices with built-in SSL termination, rate limiting, authentication, and monitoring.

## Architecture Overview

### API Gateway Purpose
- **Single Entry Point**: Unified ingress for all microservices
- **SSL Termination**: Automatic certificate management
- **Authentication**: Centralized auth for microservices
- **Rate Limiting**: Protect backend services from abuse
- **Monitoring**: Centralized logging and metrics
- **Load Balancing**: Intelligent traffic distribution

### Supported Features
- Multiple routing algorithms (round-robin, weighted, sticky sessions)
- JWT authentication and authorization
- Rate limiting per route and per client
- CORS configuration
- SSL/TLS with automatic certificate provisioning
- Request/response transformation
- Circuit breakers and retries

## Basic Configuration

### Simple API Gateway

```yaml
# See sample files in the samples/ directory for complete examples
```

### Production API Gateway

```yaml
# See sample files in the samples/ directory for complete examples
```

## Routing Configuration

### Path Patterns

#### Exact Match
```yaml
- path: "/health"          # Matches exactly /health
```

#### Prefix Match
```yaml
- path: "/api/*"           # Matches /api/users, /api/orders, etc.
```

#### Regex Match
```yaml
- path: "/api/v[0-9]+/*"   # Matches /api/v1/, /api/v2/, etc.
```

### Service Configuration

#### Basic Service Routing
```yaml
service:
  name: user-service       # Kubernetes service name
  port: 8080              # Service port
  weight: 100             # Traffic weight (for canary deployments)
```

#### Multi-Service Routing (Canary Deployment)
```yaml
# See sample files in the samples/ directory for complete examples
```

### HTTP Methods
Specify allowed HTTP methods for each route:
```yaml
methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"]
```

## Authentication and Authorization

### JWT Authentication

#### Configuration
```yaml
authentication:
  required: true
  method: "jwt"
```

#### JWT Token Requirements
- **Header**: `Authorization: Bearer <token>`
- **Algorithm**: RS256 or HS256
- **Claims**: Must include `sub`, `iss`, `exp`
- **Issuer**: Must be from approved list

#### Custom Claims
```yaml
authentication:
  required: true
  method: "jwt"
  claims:
    roles: ["admin", "user"]        # Required roles
    scope: ["read", "write"]        # Required scopes
    tenant: "acme-corp"            # Required tenant
```

### API Key Authentication

```yaml
authentication:
  required: true
  method: "apikey"
  keyLocation: "header"            # header, query, or cookie
  keyName: "X-API-Key"            # Header/query parameter name
```

### OAuth2 Authentication

```yaml
authentication:
  required: true
  method: "oauth2"
  authorizationServer: "https://auth.acme.com"
  scopes: ["read", "write"]
```

## Rate Limiting

### Basic Rate Limiting
```yaml
rateLimit:
  enabled: true
  requestsPerMinute: 1000        # Global limit per minute
```

### Advanced Rate Limiting
```yaml
rateLimit:
  enabled: true
  requestsPerMinute: 1000        # Base limit
  burstSize: 100                 # Allow bursts up to 100 requests
  keyBy: "client_ip"             # Rate limit by: client_ip, user_id, api_key
  whitelistIPs:                  # IPs exempt from rate limiting
    - "10.0.0.0/8"
    - "192.168.1.100"
```

### Per-User Rate Limiting
```yaml
rateLimit:
  enabled: true
  requestsPerMinute: 100         # Per user limit
  keyBy: "user_id"               # Extract from JWT sub claim
```

## SSL and Security

### SSL Configuration

#### Automatic Certificates (Let's Encrypt)
```yaml
ssl:
  enabled: true
  certificateSource: "letsencrypt"
  forceRedirect: true            # Redirect HTTP to HTTPS
```

#### Manual Certificates
```yaml
ssl:
  enabled: true
  certificateSource: "manual"
  secretName: "api-gateway-tls"  # Kubernetes secret with cert
```

#### Cloud Provider Certificates
```yaml
ssl:
  enabled: true
  certificateSource: "cloud"
  certificateArn: "arn:aws:acm:us-west-2:123456789:certificate/abc123"
```

### CORS Configuration

#### Basic CORS
```yaml
cors:
  enabled: true
  allowedOrigins: ["*"]          # Allow all origins (dev only)
  allowedMethods: ["GET", "POST"]
```

#### Production CORS
```yaml
# See sample files in the samples/ directory for complete examples
```

## Monitoring and Observability

### Access Logs

Enable detailed access logging:
```yaml
monitoring:
  enabled: true
  accessLogs: true               # Log all requests
  accessLogFormat: "json"        # json or combined
```

#### Log Fields
- Timestamp
- Client IP
- Request method and path
- Response status and size
- Response time
- User agent
- Referrer
- Authentication status

### Metrics

#### Prometheus Metrics
```yaml
monitoring:
  enabled: true
  metrics: true
  metricsPort: 9090
```

#### Available Metrics
- `http_requests_total`: Total number of HTTP requests
- `http_request_duration_seconds`: Request duration histogram
- `http_requests_in_flight`: Current number of requests being served
- `rate_limit_exceeded_total`: Number of rate limit violations
- `ssl_certificate_expiry_days`: Days until SSL certificate expires

### Health Checks

#### Gateway Health Endpoint
```
GET /health
```

Response:
```json
{
  "status": "healthy",
  "uptime": "72h15m30s",
  "routes": {
    "total": 5,
    "healthy": 5,
    "unhealthy": 0
  },
  "ssl": {
    "status": "valid",
    "expires": "2024-03-15T10:30:00Z"
  }
}
```

## Scaling and Performance

### Horizontal Scaling

#### Automatic Scaling
```yaml
scaling:
  minReplicas: 3                 # Minimum for HA
  maxReplicas: 15                # Scale up to handle traffic
```

#### Manual Scaling
```bash
# Scale to specific replica count
kubectl patch apigateway main-gateway -n production -p '{"spec":{"scaling":{"minReplicas":5,"maxReplicas":20}}}'
```

### Performance Optimization

#### Connection Pooling
```yaml
performance:
  maxConnections: 1000           # Max concurrent connections
  keepAliveTimeout: "60s"        # Keep-alive timeout
  connectionTimeout: "30s"       # Connection timeout to backends
```

#### Caching
```yaml
caching:
  enabled: true
  defaultTTL: "300s"            # Default cache TTL
  routes:
    - path: "/api/static/*"
      ttl: "3600s"              # Cache static content longer
```

## Deployment and Operations

### Deployment Process

#### 1. Prepare Configuration
```bash
# Copy template
cp samples/apigateway-production.yaml my-gateway.yaml

# Edit configuration
vi my-gateway.yaml
```

#### 2. Validate Configuration
```bash
# Dry-run to check for errors
kubectl apply --dry-run=client -f my-gateway.yaml

# Validate with CLI tool
crdmcp validate ./gateway-config --strict
```

#### 3. Deploy Gateway
```bash
# Apply the APIGateway resource
kubectl apply -f my-gateway.yaml

# Verify deployment
kubectl get apigateway main-gateway -n production
```

#### 4. Test Connectivity
```bash
# Test health endpoint
curl -k https://api.acme.com/health

# Test authenticated endpoint
curl -H "Authorization: Bearer $JWT_TOKEN" https://api.acme.com/users

# Test rate limiting
for i in {1..100}; do curl https://api.acme.com/health; done
```

### Rolling Updates

#### Update Route Configuration
```bash
# Update routes without downtime
kubectl patch apigateway main-gateway -n production --type='merge' -p='
{
  "spec": {
    "routes": [
      {
        "path": "/users/*",
        "service": {
          "name": "user-service-v2",
          "port": 8080
        }
      }
    ]
  }
}'
```

#### Update SSL Configuration
```bash
# Update SSL settings
kubectl patch apigateway main-gateway -n production --type='merge' -p='
{
  "spec": {
    "ssl": {
      "certificateSource": "manual",
      "secretName": "new-ssl-cert"
    }
  }
}'
```

## Troubleshooting

### Common Issues

#### 1. 502 Bad Gateway
```bash
# Check backend service health
kubectl get endpoints user-service -n production

# Test backend connectivity
kubectl run -it --rm debug --image=curlimages/curl -- curl http://user-service.production.svc.cluster.local:8080/health

# Check gateway logs
kubectl logs -l app=main-gateway -n production
```

#### 2. SSL Certificate Issues
```bash
# Check certificate status
kubectl describe apigateway main-gateway -n production | grep -i certificate

# Verify certificate details
openssl s_client -connect api.acme.com:443 -servername api.acme.com

# Check Let's Encrypt challenges
kubectl get challenges -A
```

#### 3. Authentication Failures
```bash
# Check JWT token validity
jwt decode $JWT_TOKEN

# Verify authentication configuration
kubectl get apigateway main-gateway -n production -o yaml | grep -A 10 authentication

# Check auth service logs
kubectl logs -l app=auth-service -n production
```

#### 4. Rate Limiting Issues
```bash
# Check rate limit configuration
kubectl get apigateway main-gateway -n production -o jsonpath='{.spec.routes[*].rateLimit}'

# Monitor rate limit metrics
curl http://localhost:9090/metrics | grep rate_limit

# Check client IP resolution
kubectl logs -l app=main-gateway -n production | grep "rate limit"
```

### Useful Commands

```bash
# List all API gateways
kubectl get apigateways --all-namespaces

# Get gateway status
kubectl get apigateway main-gateway -n production -o yaml

# Check gateway endpoints
kubectl get apigateway main-gateway -n production -o jsonpath='{.status.urls}'

# View gateway events
kubectl get events --field-selector involvedObject.name=main-gateway -n production

# Check load balancer IP
kubectl get apigateway main-gateway -n production -o jsonpath='{.status.loadBalancerIP}'

# Test specific route
curl -v https://api.acme.com/users -H "Authorization: Bearer $JWT_TOKEN"

# Monitor real-time logs
kubectl logs -f -l app=main-gateway -n production

# Check SSL certificate expiry
kubectl get apigateway main-gateway -n production -o jsonpath='{.status.certificateStatus}'
```

## Security Best Practices

### Network Security
- Use network policies to restrict gateway access
- Place gateways in DMZ subnets
- Use Web Application Firewall (WAF) for additional protection
- Implement DDoS protection at load balancer level

### Authentication Security
- Use strong JWT signing keys (RS256 preferred)
- Implement proper token validation
- Use short token lifetimes with refresh mechanisms
- Monitor for authentication anomalies

### SSL/TLS Security
- Use TLS 1.2 or higher
- Implement proper certificate management
- Use HTTP Strict Transport Security (HSTS)
- Regular certificate rotation

## Contact and Support

For API Gateway questions or issues:
- **Platform Team**: platform-team@acme.io
- **Slack**: #api-gateway-support
- **Documentation**: https://docs.acme.io/platform/apigateway
- **Runbooks**: https://runbooks.acme.io/apigateway
- **Emergency Escalation**: +1-555-API-GATE (24/7)

## Sample Files Reference

For complete, production-ready examples, please refer to the sample files in the `samples/` directory:

- `samples/apigateway-production.yaml` - Complete API gateway with multiple routes
