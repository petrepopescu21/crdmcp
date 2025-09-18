---
title: Test Resource Usage Guide
applicableCRDs: ["TestResource"]
tags: ["testing", "example", "guide"]
category: service
priority: 10
---

# Test Resource Usage Guide

This guide explains how to use TestResource effectively.

## Basic Configuration

The TestResource requires the following basic configuration:

```yaml
apiVersion: example.com/v1
kind: TestResource
metadata:
  name: my-resource
spec:
  enabled: true
  replicas: 3
```

## Best Practices

- Always enable the resource in production
- Monitor resource usage regularly
- Use appropriate replica counts

## Production Considerations

For production deployments, ensure:
1. High availability with replicas >= 3
2. Resource limits are set
3. Monitoring is configured