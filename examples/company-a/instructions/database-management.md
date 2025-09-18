---
title: "Database Management Guide for Acme Corp"
tags: ["database", "postgresql", "mysql", "redis", "mongodb", "backup", "security"]
category: "database"
priority: 1
---

# Database Management Guide for Acme Corp

## Overview

This guide covers the deployment, management, and operational procedures for database resources using Acme Corp's Database CRD. Our Database CRD provides a unified interface for managing various database engines with built-in backup, monitoring, and security features.

## Supported Database Engines

### PostgreSQL
- **Primary Use**: Transactional workloads, OLTP applications
- **Versions**: 12.x, 13.x, 14.x, 15.x
- **Recommended for**: User data, order processing, financial transactions

### MySQL
- **Primary Use**: Web applications, content management
- **Versions**: 8.0.x, 8.1.x
- **Recommended for**: CMS systems, e-commerce platforms

### Redis
- **Primary Use**: Caching, session storage, pub/sub
- **Versions**: 6.x, 7.x
- **Recommended for**: Application caching, real-time analytics

### MongoDB
- **Primary Use**: Document storage, content management
- **Versions**: 5.x, 6.x
- **Recommended for**: Content management, catalog data

## Database Planning

### Sizing Guidelines

#### Small Databases (< 10GB)
```yaml
storage:
  size: "20Gi"
resources:
  requests:
    cpu: "200m"
    memory: "512Mi"
  limits:
    cpu: "500m"
    memory: "1Gi"
replicas: 1  # Development only
```

#### Medium Databases (10GB - 100GB)
```yaml
storage:
  size: "100Gi"
resources:
  requests:
    cpu: "500m"
    memory: "1Gi"
  limits:
    cpu: "1000m"
    memory: "2Gi"
replicas: 3
```

#### Large Databases (> 100GB)
```yaml
storage:
  size: "500Gi"
resources:
  requests:
    cpu: "1000m"
    memory: "4Gi"
  limits:
    cpu: "2000m"
    memory: "8Gi"
replicas: 3
```

### Storage Classes
- **fast-ssd**: High-performance SSD storage for production workloads
- **standard-ssd**: Standard SSD storage for development/staging
- **slow-hdd**: HDD storage for backup and archive purposes

## Database Deployment

### PostgreSQL Production Cluster

```yaml
# See sample files in the samples/ directory for complete examples
```

### Redis Cache Cluster

```yaml
# See sample files in the samples/ directory for complete examples
```

## Backup and Recovery

### Backup Strategy

#### Automatic Backups
All production databases have automatic backups enabled:

```yaml
backup:
  enabled: true
  schedule: "0 2 * * *"    # Daily at 2 AM UTC
  retention: "30d"         # Keep backups for 30 days
```

#### Backup Schedule Recommendations
- **Critical databases**: Every 6 hours (`0 */6 * * *`)
- **Important databases**: Daily (`0 2 * * *`)
- **Development databases**: Weekly (`0 2 * * 0`)

#### Custom Backup Schedules
```bash
# Every 6 hours
"0 */6 * * *"

# Daily at 2 AM
"0 2 * * *"

# Weekly on Sunday at 2 AM
"0 2 * * 0"

# Monthly on the 1st at 2 AM
"0 2 1 * *"
```

### Recovery Procedures

#### Point-in-Time Recovery
```bash
# List available backups
kubectl exec -it database-backup-pod -- list-backups user-database

# Restore from specific backup
kubectl exec -it database-backup-pod -- restore-backup user-database 2023-10-15T02:00:00Z

# Verify restoration
kubectl logs -l app=user-database -n production
```

#### Disaster Recovery
1. **Identify failure scope**: Single pod, node, or entire cluster
2. **Check backup availability**: Verify recent backups exist
3. **Create new database instance**: Deploy with same configuration
4. **Restore from backup**: Use latest clean backup
5. **Validate data integrity**: Run application-level checks
6. **Update DNS/connections**: Point applications to new instance

## Security Configuration

### Encryption

#### At-Rest Encryption
Required for all production databases containing sensitive data:

```yaml
security:
  encryption:
    atRest: true    # Encrypts stored data
```

#### In-Transit Encryption
Required for all production databases:

```yaml
security:
  encryption:
    inTransit: true    # Encrypts network communication
```

### Authentication Methods

#### Password Authentication (Default)
```yaml
security:
  authentication:
    enabled: true
    method: "password"
```

**Password Management:**
- Passwords stored in Kubernetes secrets
- Automatic rotation every 90 days
- Minimum 16 characters with complexity requirements

#### Certificate-Based Authentication
```yaml
security:
  authentication:
    enabled: true
    method: "certificate"
```

**Use Cases:**
- Application-to-database connections
- Administrative access
- Replication connections

### Network Security

#### Network Policies
All databases are protected by network policies:
- Only authorized services can connect
- No external network access by default
- Monitoring and backup services have specific access

#### Private Subnets
Production databases run in private subnets with no internet access.

## Monitoring and Alerting

### Metrics Collection

All databases expose Prometheus-compatible metrics:

#### PostgreSQL Metrics (Port 9187)
- Connection count and states
- Query performance statistics
- Replication lag
- Table and index statistics
- Lock information

#### Redis Metrics (Port 9121)
- Memory usage and fragmentation
- Command statistics
- Connection count
- Keyspace information
- Replication status

### Standard Alerts

#### Critical Alerts (Immediate Response)
- Database unavailable
- Replication failure
- Backup failure
- Disk space > 90%
- Memory usage > 95%

#### Warning Alerts (Review Within 2 Hours)
- High connection count
- Slow queries detected
- Disk space > 80%
- Memory usage > 85%
- High replication lag

### Grafana Dashboards

Pre-configured dashboards available:
- **Database Overview**: Cross-engine resource utilization
- **PostgreSQL Details**: Query performance, locks, replication
- **Redis Details**: Memory usage, command rates, keyspace
- **Backup Status**: Backup success rates and timing

## Performance Optimization

### PostgreSQL Optimization

#### Configuration Tuning
```sql
-- Connection settings
max_connections = 200
shared_buffers = '256MB'
effective_cache_size = '1GB'

-- Query optimization
work_mem = '4MB'
maintenance_work_mem = '64MB'
random_page_cost = 1.1

-- WAL settings
wal_buffers = '16MB'
checkpoint_completion_target = 0.9
```

#### Index Management
```sql
-- Monitor index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0;

-- Create partial indexes for better performance
CREATE INDEX CONCURRENTLY idx_orders_active
ON orders (customer_id)
WHERE status = 'active';
```

### Redis Optimization

#### Memory Optimization
```bash
# Configure maxmemory and eviction policy
CONFIG SET maxmemory 1gb
CONFIG SET maxmemory-policy allkeys-lru

# Monitor memory usage
INFO memory
```

#### Connection Optimization
```bash
# Configure connection limits
CONFIG SET maxclients 10000

# Monitor connections
INFO clients
```

## Troubleshooting

### Common Issues

#### 1. Connection Refused
```bash
# Check database status
kubectl get database user-database -n production

# Check pod status
kubectl get pods -l app=user-database -n production

# Check service endpoints
kubectl get endpoints user-database -n production

# Test connectivity
kubectl run -it --rm debug --image=postgres:14 -- psql -h user-database.production.svc.cluster.local -U postgres
```

#### 2. High CPU Usage
```bash
# Check current queries (PostgreSQL)
kubectl exec -it user-database-0 -- psql -U postgres -c "SELECT query, state, query_start FROM pg_stat_activity WHERE state = 'active';"

# Check slow query log
kubectl logs user-database-0 | grep "slow query"

# Analyze query performance
kubectl exec -it user-database-0 -- psql -U postgres -c "SELECT query, calls, total_time, mean_time FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

#### 3. Backup Failures
```bash
# Check backup job status
kubectl get jobs -l backup-target=user-database -n production

# View backup logs
kubectl logs job/user-database-backup-$(date +%Y%m%d) -n production

# Verify backup storage
kubectl exec -it backup-pod -- ls -la /backups/user-database/
```

#### 4. Replication Lag
```bash
# Check replication status (PostgreSQL)
kubectl exec -it user-database-0 -- psql -U postgres -c "SELECT client_addr, state, sent_lsn, write_lsn, flush_lsn, replay_lsn, write_lag, flush_lag, replay_lag FROM pg_stat_replication;"

# Check replica status
kubectl exec -it user-database-1 -- psql -U postgres -c "SELECT pg_is_in_recovery(), pg_last_wal_receive_lsn(), pg_last_wal_replay_lsn();"
```

### Useful Commands

```bash
# List all databases
kubectl get databases --all-namespaces

# Get database connection info
kubectl get database user-database -n production -o jsonpath='{.status.primaryEndpoint}'

# Scale database (replica count)
kubectl patch database user-database -n production -p '{"spec":{"replicas":5}}'

# Check database health
kubectl get database user-database -n production -o jsonpath='{.status.health}'

# View database events
kubectl get events --field-selector involvedObject.name=user-database -n production

# Connect to database (PostgreSQL)
kubectl port-forward svc/user-database 5432:5432 -n production
psql -h localhost -U postgres

# Access database metrics
kubectl port-forward svc/user-database-metrics 9187:9187 -n production
curl http://localhost:9187/metrics
```

## Maintenance Procedures

### Regular Maintenance Tasks

#### Weekly
- Review backup success rates
- Check disk space usage
- Monitor slow query logs
- Verify replication health

#### Monthly
- Update database statistics
- Review and optimize queries
- Check index usage and cleanup unused indexes
- Review security audit logs

#### Quarterly
- Plan for version upgrades
- Review capacity requirements
- Update disaster recovery procedures
- Security compliance review

### Database Upgrades

#### Minor Version Upgrades
```bash
# Update the database version in the spec
kubectl patch database user-database -n production -p '{"spec":{"version":"14.9"}}'

# Monitor the rolling update
kubectl rollout status deployment/user-database -n production
```

#### Major Version Upgrades
1. **Plan upgrade window**: Schedule maintenance window
2. **Test in staging**: Perform full upgrade test
3. **Backup production**: Create full backup before upgrade
4. **Perform upgrade**: Update version in Database spec
5. **Validate upgrade**: Run application tests
6. **Monitor performance**: Check for any performance regressions

## Contact and Support

For database-related questions or issues:
- **Database Team**: database-team@acme.io
- **Slack**: #database-support
- **Documentation**: https://docs.acme.io/database
- **Emergency Escalation**: +1-555-DB-ADMIN (24/7)

## Sample Files Reference

For complete, production-ready examples, please refer to the sample files in the `samples/` directory:

- `samples/database-postgresql.yaml` - PostgreSQL cluster configuration
- `samples/database-redis.yaml` - Redis cache configuration
