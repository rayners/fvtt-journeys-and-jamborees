#!/bin/bash

# Define the paths
MODULE_NAME="journeys-and-jamborees"
SOURCE_DIR="$HOME/Code/personal/fvtt-journeys-and-jamborees"
DIST_DIR="$SOURCE_DIR/dist"
TARGET_DIR="$HOME/Library/Application Support/FoundryVTT/Data/modules/$MODULE_NAME"

# Create the target directory
mkdir -p "$TARGET_DIR"
mkdir -p "$TARGET_DIR/templates"
mkdir -p "$TARGET_DIR/templates/partials"
mkdir -p "$TARGET_DIR/styles"

# Copy the module files
cp "$DIST_DIR/module.js" "$TARGET_DIR/"
cp "$DIST_DIR/module.js.map" "$TARGET_DIR/"
cp "$DIST_DIR/module.json" "$TARGET_DIR/"

# Copy the template files
cp "$DIST_DIR/templates/"*.hbs "$TARGET_DIR/templates/"
cp "$DIST_DIR/templates/partials/"*.hbs "$TARGET_DIR/templates/partials/"

# Copy the style files
cp "$DIST_DIR/styles/journeys-and-jamborees.css" "$TARGET_DIR/styles/"

# Copy any language files
if [ -d "$DIST_DIR/languages" ]; then
  mkdir -p "$TARGET_DIR/languages"
  cp "$DIST_DIR/languages/"* "$TARGET_DIR/languages/"
fi

# Copy any asset files
if [ -d "$DIST_DIR/assets" ]; then
  mkdir -p "$TARGET_DIR/assets"
  cp -r "$DIST_DIR/assets/"* "$TARGET_DIR/assets/"
fi

echo "Module linked to Foundry VTT modules directory."
