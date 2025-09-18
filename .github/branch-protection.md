# Branch Protection Settings for Main Branch

## Required Status Checks

Configure the following required status checks for the `main` branch:

### Required Checks Before Merging:
- ✅ **CI / Lint & Format** - ESLint and Prettier checks must pass
- ✅ **CI / Test** - All tests must pass
- ✅ **CI / Build & Type Check** - TypeScript compilation must succeed
- ✅ **CI / All CI Checks** - Summary check that all CI steps passed

### Manual/On-Demand Workflows:
- 🤖 **Claude Code Review** - Manual dispatch workflow for code reviews

### Recommended Settings:
1. **Require branches to be up to date before merging**: Yes
2. **Require conversation resolution before merging**: Yes
3. **Dismiss stale pull request approvals when new commits are pushed**: Yes
4. **Require review from CODEOWNERS when specified**: Yes (if using CODEOWNERS)

### How to Configure in GitHub:

1. Go to **Settings** → **Branches**
2. Click **Add rule** or edit existing rule for `main`
3. Enable **Require status checks to pass before merging**
4. Search and select these required checks:
   - `CI / Lint & Format`
   - `CI / Test`
   - `CI / Build & Type Check`
   - `CI / All CI Checks`
5. Enable **Require branches to be up to date before merging**
6. Configure additional protection rules as needed
7. Click **Create** or **Save changes**

### CI Workflow Jobs:

| Job Name | Description | Must Pass |
|----------|-------------|-----------|
| `lint` | Runs ESLint and Prettier formatting check | ✅ Yes |
| `test` | Runs Jest test suite with coverage | ✅ Yes |
| `build` | Compiles TypeScript and verifies output | ✅ Yes |
| `all-checks` | Verifies all other jobs passed | ✅ Yes |

### Coverage Reports:
Test coverage reports are automatically generated and uploaded as artifacts for each PR.

## Manual Claude Code Review

The Claude Code Review workflow uses manual dispatch for complete control:

### How to Run a Review:

1. **Go to Actions Tab**:
   - Navigate to **Actions** → **Claude Code Review**
   - Click **Run workflow**

2. **Fill in Parameters**:
   - **PR Number**: Enter the PR number you want to review (e.g., `123`)
   - **Review Scope**: Choose focus area:
     - `full`: Complete code review covering all aspects
     - `security`: Focus on security vulnerabilities and best practices
     - `performance`: Focus on performance issues and optimizations
     - `style`: Focus on code style, formatting, and conventions

3. **Run Review**:
   - Click **Run workflow**
   - Claude will review the specified PR and post comments directly on it

### Requirements:

- **CLAUDE_CODE_OAUTH_TOKEN**: Must be set as a repository secret
- **Permissions**: Workflow has write access to pull requests and issues
- **Manual Control**: Only runs when explicitly triggered by a maintainer

### Benefits:

- ✅ **Complete Control**: Reviews only run when you want them
- ✅ **Targeted Reviews**: Choose specific scope (security, performance, etc.)
- ✅ **No Automatic Execution**: Never runs without explicit approval
- ✅ **Flexible**: Can review any PR at any time

This approach gives you full control over when and how Claude reviews your code.