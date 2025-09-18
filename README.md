# CRD MCP Server

A generic Model Context Protocol (MCP) server for Kubernetes Custom Resource Definitions (CRDs). This server allows companies to load their own CRDs, sample manifests, and custom instructions to enable AI-assisted infrastructure management.

## Features

- 🔍 **CRD Discovery**: Load and explore custom Kubernetes resources
- 📝 **Sample Manifests**: Access example configurations for each resource type
- 📚 **Instruction Documents**: Company-specific guidance and best practices
- 🤖 **MCP Integration**: Works with Claude and other MCP-compatible AI tools
- ✅ **Full Testing**: Comprehensive test suite with CI/CD pipeline

## Quick Start

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run with example data
npm run server -- --data-dir ./examples/company-a
```

## Development

```bash
# Run in development mode
npm run dev

# Run tests
npm test

# Run linting
npm run lint

# Format code
npm run format
```

## CI/CD Pipeline

This project includes a comprehensive CI/CD pipeline that runs on every PR:

### Required Checks
- ✅ **Linting**: ESLint and Prettier formatting
- ✅ **Testing**: Jest test suite with coverage reporting
- ✅ **Building**: TypeScript compilation
- ✅ **Type Checking**: Full type validation

### Running CI Locally
```bash
# Run all CI checks
npm run lint && npm test && npm run build
```

## Project Structure

```
├── src/
│   ├── loaders/        # Data loading modules
│   ├── tools/          # MCP tool implementations
│   ├── types/          # TypeScript definitions
│   └── utils/          # Helper functions
├── tests/              # Test suite
│   ├── fixtures/       # Test data
│   └── loaders/        # Loader tests
├── examples/           # Example company data
└── .github/            # CI/CD configuration
```

## Testing

The project includes comprehensive testing:

- **Unit Tests**: For individual loaders and utilities
- **Integration Tests**: For data loading pipeline
- **Coverage Reports**: Automatically generated with each test run

Run tests:
```bash
npm test                # Run all tests
npm run test:watch      # Run in watch mode
npm run test:coverage   # Generate coverage report
```

## Contributing

Please see [Contributing Guidelines](.github/CONTRIBUTING.md) for details.

### Pull Request Process
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure all tests pass
5. Submit a PR using the template

All PRs must pass the following checks:
- Linting (no errors)
- All tests passing
- Successful build
- Code review approval

## License

ISC License - see [LICENSE](LICENSE) file for details.

## Author

Petre Popescu

## Status

🚧 **Under Development** - See [TODO.md](TODO.md) for roadmap