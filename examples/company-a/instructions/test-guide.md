---
title: Test Resource Guide
applicableCRDs: ["TestResource"]
tags: ["test", "example"]
category: service
priority: 5
---

# Test Resource Guide

This is a simple test resource for demonstrating the MCP server functionality.

## Basic Usage

Create a test resource:

```yaml
apiVersion: example.com/v1
kind: TestResource
metadata:
  name: my-test
spec:
  replicas: 1
  enabled: true
```

## Best Practices

**Best Practice**: Always set enabled to true for active resources.

**Important**: Monitor resource usage and adjust replicas as needed.