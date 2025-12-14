# Release Guide

This document describes how to release a new version of PanelGrid.

## Overview

PanelGrid uses [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) to automate version bumping, CHANGELOG generation, and git tagging. The tool analyzes commit messages following [Conventional Commits](https://www.conventionalcommits.org/) to determine the appropriate version bump.

## Prerequisites

Before releasing, ensure:

- All changes are committed to the `main` branch
- CI tests are passing
- You have push access to the repository
- You're on the latest `main` branch: `git pull origin main`

## Release Workflow

### 1. Prepare the Release

Run the release command to automatically update version, CHANGELOG, and create a git tag:

```bash
# Auto-detect version bump based on commits
yarn release

# Or manually specify the bump type:
yarn release:patch   # 0.3.0 → 0.3.1
yarn release:minor   # 0.3.0 → 0.4.0
yarn release:major   # 0.3.0 → 1.0.0

# Preview changes without making them:
yarn release:dry-run
```

### 2. Review the Changes

Review what was generated:

```bash
git show HEAD        # View the release commit
cat CHANGELOG.md     # Check the updated CHANGELOG
```

If needed, undo the release with:
```bash
git reset --hard HEAD~1
git tag -d v$(node -p "require('./package.json').version")
```

### 3. Push the Release

Push both the commit and the tag to trigger the automated publish workflow:

```bash
git push --follow-tags
```

This triggers GitHub Actions to:
- Run tests, linting, and type checking
- Build the package
- Publish to npm
- Create a GitHub Release

### 4. Verify the Release

- Check [GitHub Actions](https://github.com/chloe463/panelgrid/actions) for workflow status
- Verify the new version on [npmjs.com/package/panelgrid](https://www.npmjs.com/package/panelgrid)
- Confirm the release in [GitHub Releases](https://github.com/chloe463/panelgrid/releases)

## Version Bump Rules

The tool determines version bumps based on commit messages:

| Commit Type | Example | Version Bump |
|-------------|---------|--------------|
| `fix:` | `fix: Resolve collision bug` | **Patch** (0.3.0 → 0.3.1) |
| `feat:` | `feat: Add new resize handles` | **Minor** (0.3.0 → 0.4.0) |
| `feat!:` or `BREAKING CHANGE:` | `feat!: Change API signature` | **Major** (0.3.0 → 1.0.0) |

**Note**: Commits with types `docs:`, `test:`, `chore:`, `ci:`, `build:`, `style:` are excluded from the CHANGELOG.

## Configuration

The release process is configured in:

- `.versionrc.json` - commit-and-tag-version configuration
- `package.json` - Release scripts
- `.github/workflows/publish.yml` - npm publish automation

## References

- [commit-and-tag-version Documentation](https://github.com/absolute-version/commit-and-tag-version)
- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)