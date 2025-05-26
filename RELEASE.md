# Journeys & Jamborees Release Checklist

This document contains the release process for publishing new versions of the Journeys & Jamborees module.

## Pre-Release Checklist

### 1. Update Module Manifest (module.json)
- [ ] Update version number using clean semantic versioning (no suffixes)
  - Early releases: `0.1.0`, `0.2.0`, etc.
  - Stable releases: `1.0.0`, `1.1.0`, etc.
  - **Note**: Avoid `-alpha`, `-beta` suffixes as Foundry may not handle version comparison correctly
- [ ] **CRITICAL**: Update `manifest` and `download` URLs to point to the EXACT version being released:
  ```json
  "manifest": "https://github.com/rayners/fvtt-journeys-and-jamborees/releases/download/v{VERSION}/module.json",
  "download": "https://github.com/rayners/fvtt-journeys-and-jamborees/releases/download/v{VERSION}/journeys-and-jamborees-v{VERSION}.zip"
  ```
  - ❌ **NEVER use `/latest/`** - this breaks Foundry's update mechanism
  - ✅ **Always use exact version** (e.g., `v0.1.0`)
- [ ] Verify `url` points to the repository
- [ ] Verify `readme` and `changelog` URLs are correct

### 2. Update Documentation
- [ ] Update CHANGELOG.md with release notes
- [ ] Update README.md with installation instructions (if first public release)
- [ ] Verify all documentation is up to date

### 3. Build and Package
- [ ] Run tests: `npm test:run`
- [ ] Build the module: `npm run build`
- [ ] Create release package: `./build.sh`
- [ ] Verify the zip file contains all necessary files

### 4. Test Installation
- [ ] Test installing from manifest URL in a clean Foundry instance
- [ ] Verify all features work as expected
- [ ] Test in supported game systems (Dragonbane, D&D 5e, etc.)

### 5. Create GitHub Release
- [ ] Go to GitHub repository → Releases → Draft a new release
- [ ] Create tag matching version (e.g., `v0.1.0`)
- [ ] Set release title (e.g., "v0.1.0 - Initial Release")
- [ ] Add release notes highlighting:
  - New features
  - Bug fixes
  - Known issues
  - Breaking changes (if any)
- [ ] Mark as pre-release if early/unstable version
- [ ] Upload the module zip file as release asset
- [ ] Publish release

### 6. Post-Release
- [ ] Verify manifest URL works for installation
- [ ] Test installing from Foundry's module browser
- [ ] Update Linear tickets/project status
- [ ] Announce release (Discord, forums, etc.)

## Installation Instructions Template

For README.md:

```markdown
## Installation

### Method 1: Foundry Module Browser
1. Open Foundry VTT
2. Go to Add-on Modules
3. Click "Install Module"
4. Search for "Journeys & Jamborees"
5. Click Install

### Method 2: Manifest URL
1. Open Foundry VTT
2. Go to Add-on Modules
3. Click "Install Module"
4. Paste this URL in the Manifest URL field:
   ```
   https://github.com/rayners/fvtt-journeys-and-jamborees/releases/download/v{VERSION}/module.json
   ```
   Replace `{VERSION}` with the actual release version (e.g., `v0.1.0`)
5. Click Install

**Note**: Always use the specific version URL, never `/latest/`
```

## Release Notes Template

```markdown
## v{VERSION} - {DATE}

### ✨ New Features
- Feature description

### 🐛 Bug Fixes
- Fix description

### 📝 Documentation
- Documentation updates

### ⚠️ Known Issues
- Issue description

### 💔 Breaking Changes
- Breaking change description (if any)
```