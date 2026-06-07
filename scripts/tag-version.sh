#!/bin/bash
# ==============================================================================
# LIQIFIN — Automated Git Version Tagging Script
# ==============================================================================

# Extract version from backend/package.json
VERSION=$(node -p "require('./backend/package.json').version" 2>/dev/null)

if [ -z "$VERSION" ]; then
  echo "[ERROR] Could not read version from backend/package.json"
  exit 1
fi

TAG="v$VERSION"
echo "======================================================================"
echo "  LIQIFIN Version Tagging Tool"
echo "  Detected package version: $VERSION"
echo "  Target Git Tag          : $TAG"
echo "======================================================================"

# Check if git repository is initialized
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "[ERROR] Not a git repository! Cannot create release tags."
  exit 1
fi

# Check if tag already exists
if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "[WARNING] Git tag '$TAG' already exists on this repository."
  echo "Please increment the version in your package.json first."
  exit 0
fi

# Create annotated tag
git tag -a "$TAG" -m "Release version $TAG"
if [ $? -eq 0 ]; then
  echo "[*] Git tag '$TAG' created successfully."
  echo "To push the tag to your remote server, run:"
  echo "    git push origin $TAG"
else
  echo "[ERROR] Failed to create git tag '$TAG'."
  exit 1
fi
