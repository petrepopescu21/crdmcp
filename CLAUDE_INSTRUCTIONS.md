# Instructions for Working with CRD MCP Server

When a user asks you to create, deploy, or work with Kubernetes resources, ALWAYS follow this workflow:

## Required Workflow

### Step 1: Discover Available Resources
```
Use `list-available-resources` to see what's available
```

### Step 2: Get Detailed Information
```
Use `get-resource-details` with the specific resourceType to understand:
- The resource schema
- Available samples
- Related documentation
```

### Step 3: Read Instructions and Guidance
```
Use `get-resource-guidance` with the resourceType to read:
- Deployment procedures
- Best practices
- Configuration guidelines
- Operational requirements
```

### Step 4: Review Examples
```
Use `find-samples` with the resource kind to see:
- Simple examples for learning
- Complex examples for production
- Different use cases and configurations
```

### Step 5: Create Based on Guidance
Only AFTER reading the instructions and samples, create the YAML manifest following:
- The patterns shown in samples
- The requirements from instructions
- The schema from resource details

## Example Interaction Pattern

**User**: "I need a trading engine for forex momentum strategies"

**You should**:
1. `list-available-resources` → Find TradingEngine
2. `get-resource-details` with "TradingEngine" → Understand the schema
3. `get-resource-guidance` with "TradingEngine" → Read deployment guide
4. `find-samples` with kind "TradingEngine" → See examples
5. Create YAML following the guidance and examples

## Important Notes

- **Never skip the guidance step** - The instructions contain critical deployment information
- **Always check samples first** - They show real working configurations
- **Follow the patterns** - Use the same naming conventions and structures as the samples
- **Read ALL guidance** - Instructions contain deployment procedures and best practices
- **Use the exact schema** - Resource details show required and optional fields

## Common Mistakes to Avoid

❌ Creating resources without reading instructions
❌ Ignoring the samples and creating from scratch
❌ Not following the documented patterns
❌ Skipping the resource details to understand the schema

✅ Always use the MCP tools to gather information first
✅ Follow the documented procedures and patterns
✅ Base configurations on the provided samples
✅ Read the full guidance before creating resources