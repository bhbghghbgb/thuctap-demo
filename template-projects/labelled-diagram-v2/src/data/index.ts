import type { LabelledDiagramAppData } from "../types";

/* eslint-disable @typescript-eslint/no-explicit-any */
const RAW_DATA =
  (window as any).APP_DATA ||
  (window as any).MY_APP_DATA ||
  (window as any).win?.DATA;
/* eslint-enable @typescript-eslint/no-explicit-any */

export const APP_DATA: LabelledDiagramAppData = RAW_DATA || {
  imagePath: null,
  points: [
    { id: "1", text: "Head", xPercent: 50, yPercent: 15 },
    { id: "2", text: "Body", xPercent: 50, yPercent: 50 },
    { id: "3", text: "Left Arm", xPercent: 20, yPercent: 40 },
    { id: "4", text: "Right Arm", xPercent: 80, yPercent: 40 },
    { id: "5", text: "Left Leg", xPercent: 30, yPercent: 80 },
    { id: "6", text: "Right Leg", xPercent: 70, yPercent: 80 },
  ],
  _pointCounter: 6,
};

/**
 * Resolves an asset path to a usable URL.
 * In the exported game, user assets are in assets/user/
 */
export const resolveAssetUrl = (path: string | null) => {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("data:")) return path;

  // If it's a relative path from the builder, it might look like "assets/filename.png"
  // In the exported game, these are moved to "assets/user/filename.png"
  // However, the builder might already inject the correct path.
  // We'll assume the path is relative to the index.html
  return path;
};
