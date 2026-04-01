# Tutorial Viewer Integration Example

This example shows how to integrate the Tutorial Viewer component into the `group-sort` game template.

## Step 1: Add the Dependency

Update `group-sort/package.json`:

```json
{
  "dependencies": {
    "@minigame/tutorial-viewer": "workspace:*",
    "@dnd-kit/core": "^6.3.1",
    "@dnd-kit/utilities": "^3.2.2",
    "clsx": "^2.1.1",
    "framer-motion": "^12.36.0",
    "react": "^19.2.4",
    "react-dom": "^19.2.4"
  }
}
```

## Step 2: Install Dependencies

From the `template-projects` root:

```bash
cd template-projects
yarn install
```

## Step 3: Add Tutorial Images

Place your tutorial images in `group-sort/images/`:

```
group-sort/images/
├── tutorial-1.png
├── tutorial-2.png
├── tutorial-3.png
└── ...
```

## Step 4: Use the Component

In your game's main component (e.g., `group-sort/src/App.tsx`):

```tsx
import { useState, useEffect } from "react";
import { TutorialViewer } from "@minigame/tutorial-viewer";

function App() {
  const [showTutorial, setShowTutorial] = useState(false);

  // Optional: Show tutorial on first visit
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem("hasSeenTutorial");
    if (!hasSeenTutorial) {
      setShowTutorial(true);
      localStorage.setItem("hasSeenTutorial", "true");
    }
  }, []);

  return (
    <div className="app">
      {/* Your game UI */}
      <header>
        <h1>Group Sort Game</h1>
        <button onClick={() => setShowTutorial(true)}>
          How to Play
        </button>
      </header>

      {/* Game content */}
      <main>
        {/* Your game components */}
      </main>

      {/* Tutorial Viewer */}
      <TutorialViewer
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        basePath="images/"
        filenamePattern="tutorial"
        fileExtension="png"
      />
    </div>
  );
}

export default App;
```

## Step 5: Build and Test

```bash
cd group-sort
yarn build
```

## Alternative: Manual Image List

If you prefer to specify exact image paths:

```tsx
import { TutorialViewer, type TutorialImage } from "@minigame/tutorial-viewer";

const tutorialImages: TutorialImage[] = [
  { src: "images/intro.png", alt: "Introduction to the game" },
  { src: "images/drag-example.png", alt: "Drag items to groups" },
  { src: "images/success.png", alt: "Success example" },
];

function App() {
  const [showTutorial, setShowTutorial] = useState(false);

  return (
    <>
      <button onClick={() => setShowTutorial(true)}>How to Play</button>
      
      <TutorialViewer
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        images={tutorialImages}
      />
    </>
  );
}
```

## Notes

### Working in IDE

You can still open `group-sort/` directly in your IDE:

```bash
cd group-sort
code .  # Opens VS Code in the group-sort folder
```

All workspace dependencies are resolved correctly because Yarn hoists them to the `template-projects/node_modules`.

### TypeScript Support

The component includes TypeScript declarations, so you get full type safety:

```tsx
import { TutorialViewer, type TutorialImage, type TutorialViewerProps } from "@minigame/tutorial-viewer";
```

### Customization

The component is designed to be simple and focused. If you need more customization:

1. **Fork the component** within your project (copy the source files)
2. **Modify as needed** for your specific game
3. **Keep the workspace reference** if you want to sync with future updates

## Troubleshooting

### "Module not found" error

Make sure you ran `yarn install` from the `template-projects` root, not just from `group-sort/`.

### TypeScript errors

The workspace package should provide types automatically. If you see errors:

1. Check that `@minigame/tutorial-viewer` is in your `dependencies`
2. Run `yarn install` again
3. Restart your TypeScript server in the IDE

### Images don't load

- Verify the images exist at the specified paths
- Check the `basePath`, `filenamePattern`, and `fileExtension` props
- Use browser DevTools Network tab to see failed image requests
