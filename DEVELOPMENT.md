# Development Guide

This guide helps contributors set up their development environment for the Journeys & Jamborees Foundry VTT module.

## Prerequisites

- **Node.js**: Version 18 or higher
- **npm**: Version 8 or higher (comes with Node.js)
- **Foundry VTT**: Version 12 or 13 installed locally
- **Git**: For version control

## Initial Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/rayners/fvtt-journeys-and-jamborees.git
   cd fvtt-journeys-and-jamborees
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Build the module**
   ```bash
   npm run build
   ```

## Development Workflow

### Available Scripts

- `npm run build` - Build the module for production
- `npm run watch` - Build and watch for changes
- `npm run lint` - Check code style
- `npm run lint:fix` - Fix code style issues
- `npm run format` - Format code with Prettier
- `npm run test` - Run tests in watch mode
- `npm run test:run` - Run tests once
- `npm run validate` - Run all checks (lint, format, test, build)

### Linking to Foundry VTT

To test the module in Foundry VTT, you need to link it to your Foundry data directory:

**macOS/Linux:**

```bash
# Find your Foundry data directory (usually ~/Documents/FoundryVTT/Data)
ln -s $(pwd)/dist ~/Documents/FoundryVTT/Data/modules/journeys-and-jamborees
```

**Windows:**

```cmd
# Run as Administrator
mklink /D "C:\Users\%USERNAME%\AppData\Local\FoundryVTT\Data\modules\journeys-and-jamborees" "%CD%\dist"
```

After linking, restart Foundry VTT and enable the module in your world.

## Code Style

This project uses:

- **ESLint** for TypeScript linting
- **Prettier** for code formatting
- **EditorConfig** for consistent editor settings

### VS Code Setup

If you use VS Code, install the recommended extensions when prompted. The workspace settings are already configured for:

- Format on save
- ESLint auto-fix on save
- TypeScript validation
- Proper file associations

### Style Guidelines

- Use TypeScript for all new code
- Follow the existing code patterns
- Write descriptive commit messages
- Add JSDoc comments for public APIs
- Keep functions small and focused
- Prefer composition over inheritance

## Testing

### Unit Tests

We use Vitest for unit testing:

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Generate coverage report
npm run test:coverage
```

### Integration Tests

Integration tests use the Quench module in Foundry VTT:

1. Install the Quench module in Foundry
2. Enable both Quench and Journeys & Jamborees
3. Click the beaker icon to run tests

## Project Structure

```
├── src/                 # Source TypeScript files
│   ├── applications/    # Foundry Application classes
│   ├── documents/       # Document classes
│   ├── types/           # TypeScript type definitions
│   └── module.ts        # Main entry point
├── templates/           # Handlebars templates
├── styles/              # SCSS stylesheets
├── languages/           # Localization files
├── test/                # Unit tests
└── dist/                # Built module (git-ignored)
```

## Making Changes

1. Create a feature branch
2. Make your changes
3. Run `npm run validate` to check everything
4. Commit your changes
5. Push and create a pull request

## Common Tasks

### Adding a New Feature

1. Create new TypeScript files in appropriate directories
2. Add tests for your code
3. Update localization strings in `languages/en.json`
4. Document any new APIs or settings

### Fixing a Bug

1. Write a test that reproduces the bug
2. Fix the bug
3. Ensure the test passes
4. Check for regressions with `npm run test:run`

### Updating Dependencies

```bash
# Check for outdated packages
npm outdated

# Update dependencies (be careful with major versions)
npm update

# Test everything still works
npm run validate
```

## Troubleshooting

### Module not showing in Foundry

- Check the symlink/junction is correct
- Ensure `dist/module.json` exists
- Check for build errors
- Restart Foundry VTT

### TypeScript errors

- Run `npm install` to ensure all types are installed
- Check `tsconfig.json` for proper configuration
- Some warnings are expected (see `src/types/foundry-extensions.d.ts`)

### Tests failing

- Ensure you have the latest dependencies
- Check if mocks need updating
- Run tests individually to isolate issues

## Getting Help

- Check existing issues on GitHub
- Read the module documentation
- Ask in the Foundry VTT Discord server

## Contributing

Please read CONTRIBUTING.md for detailed contribution guidelines.
