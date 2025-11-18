# sync-pyproject-nx-deps

A TypeScript CLI tool that automatically synchronizes Python workspace dependencies from `pyproject.toml` files to Nx monorepo `project.json` files.

## Overview

This tool bridges the gap between Python's `uv` package manager workspace dependencies and Nx's implicit dependencies system. It automates the process of keeping Nx's dependency graph in sync with Python workspace dependencies, preventing manual errors and maintaining accurate build graphs.

## Features

- **Automatic Synchronization**: Keeps Nx `implicitDependencies` in sync with Python workspace deps
- **Smart Updates**: Only writes files when changes are detected
- **Graceful Error Handling**: Warnings don't stop the entire sync process
- **Deterministic Output**: Dependencies are always sorted alphabetically
- **Quoted Name Support**: Handles special characters in package names
- **Package Name Mapping**: Translates between Python package names and Nx project names

## Installation

```bash
npm install -g sync-pyproject-nx-deps
```

Or use directly with npx:

```bash
npx sync-pyproject-nx-deps
```

## Usage

### CLI

```bash
# Sync dependencies in the current directory
sync-pyproject-nx-deps

# Sync dependencies in a specific directory
sync-pyproject-nx-deps ./python

# Using npx
npx sync-pyproject-nx-deps ./python
```

### Programmatic API

```typescript
import { syncPyprojectDeps } from 'sync-pyproject-nx-deps';

await syncPyprojectDeps('./python');
```

## How It Works

### Architecture

The tool follows a pipeline-based architecture with 4 main stages:

```
Scanner → Mapper → Parser → Updater
```

1. **Scanner**: Discovers all `pyproject.toml` files in the monorepo
2. **Mapper**: Maps Python package names to Nx project names
3. **Parser**: Extracts workspace dependencies from `[tool.uv.sources]`
4. **Updater**: Updates `project.json` files with `implicitDependencies`

### End-to-End Workflow

```
User runs: sync-pyproject-nx-deps ./python

1. Scanner finds:
   python/package-a/pyproject.toml
   python/package-b/pyproject.toml

2. Mapper builds mapping:
   { "package-a": "python-package-a", "package-b": "python-package-b" }

3. Parser extracts workspace deps from package-a's pyproject.toml:
   [tool.uv.sources]
   package-b = { workspace = true }

4. Mapper translates Python names to Nx names:
   ["package-b"] → ["python-package-b"]

5. Updater writes to package-a's project.json:
   { "implicitDependencies": ["python-package-b"] }
```

## Example

### Python Workspace Setup

**python/package-a/pyproject.toml**:
```toml
[project]
name = "package-a"

[tool.uv.sources]
package-b = { workspace = true }
"quoted-package" = { workspace = true }
```

**python/package-a/project.json**:
```json
{
  "name": "python-package-a"
}
```

### After Running sync-pyproject-nx-deps

**python/package-a/project.json**:
```json
{
  "name": "python-package-a",
  "implicitDependencies": ["python-package-b", "python-quoted-package"]
}
```

## Requirements

- Node.js >= 18
- Python projects using `uv` package manager
- Nx monorepo with `project.json` files

## Project Structure

```
src/
├── cli.ts              # CLI entry point
├── index.ts            # Library entry point
└── lib/
    ├── scanner.ts      # Finds all pyproject.toml files
    ├── mapper.ts       # Maps Python package names to Nx project names
    ├── parser.ts       # Extracts workspace dependencies
    ├── updater.ts      # Updates project.json files
    └── sync.ts         # Main orchestrator
```

## Development

### Setup

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Run in development
npm run dev
```

### Testing

The project includes comprehensive test coverage:

```bash
npm test
```

Tests cover:
- Parser for various `pyproject.toml` scenarios
- Updater for file modification behavior
- Integration tests for the full sync workflow
- Edge cases: empty dependencies, quoted names, missing sections

## Use Case

This tool is designed for Python monorepos managed by Nx that use the `uv` package manager. It solves the problem of manual dependency synchronization:

- **Python side**: Uses `pyproject.toml` with `[tool.uv.sources]` for workspace dependencies
- **Nx side**: Uses `project.json` with `implicitDependencies` for build graph
- **This tool**: Automates the bidirectional translation and keeps them in sync

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
