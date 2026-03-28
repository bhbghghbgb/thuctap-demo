# Template Projects

This directory contains **game template projects** — standalone web applications that define the games teachers can create with the Minigame Builder.

## Overview

Each subdirectory here is a complete, independent web application that:

- Uses **any tooling** you prefer (Vite, Webpack, Rollup, etc.)
- Builds to a **single `index.html`** file (via `vite-plugin-singlefile` or equivalent)
- Reads teacher-created data from `window.APP_DATA` at runtime
- Works completely offline in any browser

## Recommended Starting Point

**Use `group-sort/` as your template.** It's configured with:

- ✅ Vite + React 19
- ✅ React Compiler (automatic memoization)
- ✅ `vite-plugin-singlefile` for single-file output
- ✅ Proper `window.APP_DATA` integration
- ✅ Modern best practices

Copy it to start:

```bash
cp -r template-projects/group-sort template-projects/my-new-game
```

## Tooling is Unrestricted

While `group-sort` uses Vite + React, you can use **anything**:

- Vue, Svelte, Angular, Solid
- Vanilla JavaScript
- Preact, Alpine.js
- Any build tool (Vite, Webpack, Parcel, esbuild)

**Only the build output matters** (see requirements below).

## Requirements

### Build Output

Your template must produce:

| File                 | Requirement                                                                            |
| -------------------- | -------------------------------------------------------------------------------------- |
| `index.html`         | **Single-file HTML** — all JS/CSS inlined. Use `vite-plugin-singlefile` or equivalent. |
| `images/` (optional) | Image assets that can't be inlined. Keep minimal.                                      |

> ⚠️ **No other assets.** Fonts, icons, small SVGs should be inlined into the HTML.

### Runtime Data Contract

The builder injects teacher data before the first `<script>` tag:

```html
<script>
  window.APP_DATA = {
    /* teacher's data */
  };
  window.MY_APP_DATA = window.APP_DATA; // legacy alias
  window.win = { DATA: window.APP_DATA }; // legacy alias
</script>
```

Your game reads `window.APP_DATA` at startup. The shape is up to you!

### `meta.json`

Each template must have a `meta.json` at the root level:

```json
{
  "name": "Human-readable Game Name",
  "description": "One sentence shown on the home screen.",
  "gameType": "your-game-id",
  "version": "1.0.0"
}
```

Optionally add `thumbnail.png` for the home screen card.

## Directory Structure

```
my-new-game/
├── src/                    # Your game source code
├── public/                 # Static assets (if needed)
├── images/                 # Game images (referenced in build)
├── index.html              # HTML entry point
├── package.json            # Dependencies and scripts
├── vite.config.ts          # Build configuration
├── meta.json               # ⭐ Template metadata (REQUIRED)
└── thumbnail.png           # Home screen thumbnail (optional)
```

## Build Process

Templates are built by `build-templates.sh` from the project root:

```bash
# Build all templates
./build-templates.sh

# Build specific template
./build-templates.sh my-new-game
```

Built output is copied to `builder-projects/electron-app-mui/templates/<game-id>/game/`.

## Development Workflow

### 1. Develop Your Game

```bash
cd template-projects/my-new-game
yarn install
yarn dev
```

Your game should work standalone in the browser during development.

### 2. Test with Mock Data

In your browser console, set mock data:

```javascript
window.APP_DATA = {
  // Your game's data structure
  items: [{ id: "1", text: "Hello" }],
};
```

### 3. Build and Test in Builder

```bash
# From project root
./build-templates.sh my-new-game

# Run the builder
cd builder-projects/electron-app-mui
yarn dev
```

### 4. Verify Integration

- [ ] Game appears on builder home screen
- [ ] Creating a project works
- [ ] Editor can modify data
- [ ] Preview shows your game with data
- [ ] Export produces working standalone game

## Adding a New Game

See the complete guide in the [Root README](../../README.md#adding-a-new-game---quick-start).

Quick steps:

1. Copy `group-sort/` to create your template
2. Modify `meta.json` with your game info
3. Update `build-templates.sh` to register your game
4. Build and test

## For AI Chatbots

**Context**: This directory (`template-projects/`) contains the **source code** for all game templates. Each is an independent web application with its own `package.json`, dependencies, and build process.

**Important**: The built output lives in `builder-projects/electron-app-mui/templates/<game-id>/game/`. Those folders contain **only minified/bundled `index.html` files** (and optionally an `images/` folder). There is no useful source code to read in those build output folders — they exist solely for runtime use by the Electron app. **Always read from `template-projects/<game-id>/`** to understand the game logic and source code. Reading the `game/` folder contents will waste your context window with minified code.

**Key Files** (in each `template-projects/<game-id>/` folder):

- `meta.json` — Template registration (name, description, gameType)
- `vite.config.ts` — Build configuration
- `src/` — Game source code
- `images/` — Game assets

**Build Command**: `yarn build` (in each template directory)

**Output**: Single `index.html` + `images/` folder (copied to `builder-projects/electron-app-mui/templates/`)

## Troubleshooting

### Build fails with "Template not found"

Ensure `meta.json` exists at the template root (not inside `src/`).

### Game doesn't receive `window.APP_DATA`

Check that your build produces a single HTML file. The builder injects data before the first `<script>` tag.

### Images don't load in exported game

Images must be in an `images/` folder at the root. The builder copies this folder alongside the exported HTML.

### Build output is multiple files

Use `vite-plugin-singlefile` or equivalent to inline all JS/CSS into the HTML.

## Examples

See existing templates for reference:

- `group-sort/` — Modern React + Vite (recommended base)
- `plane-quiz/` — Quiz game with multiple choice
- `balloon-letter-picker/` — Interactive word game
- `pair-matching/` — Memory matching game
- `word-search/` — Classic word search puzzle
- `whack-a-mole/` — Reaction game

---

**Next Steps**: Ready to create? Copy `group-sort/` and start building! 🚀
