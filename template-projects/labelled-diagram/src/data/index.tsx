import type { DiagramData } from "../types/diagram";

export const DIAGRAM_DATA: DiagramData = {
  id: "body",
  name: "Cơ thể người",
  imagePath: "/img/Human/Akari.png", // Hỗ trợ PNG, JPG, SVG - thay ảnh thực của bạn ở đây

  labels: [
    { id: "l1", name: "Head"},
    { id: "l2", name: "Chest"},
    { id: "l3", name: "Leg"},
    { id: "l4", name: "Foot"},
    { id: "l5", name: "Hand"},
    { id: "l6", name: "Ear"},
    { id: "l7", name: "Shoulder"},
    { id: "l8", name: "Eye"},
    { id: "l9", name: "Mouth"},
    { id: "l10", name: "Body"},
    { id: "l11", name: "Arm"},
  ],

  zones: [
    { id: "z1", correctLabelId: "l1", x: 50, y: 15 },
    { id: "z2", correctLabelId: "l2", x: 49, y: 48 },
    { id: "z3", correctLabelId: "l3", x: 40, y: 82 },
    { id: "z4", correctLabelId: "l4", x: 70, y: 85 },
    { id: "z5", correctLabelId: "l5", x: 18, y: 61 },
    { id: "z6", correctLabelId: "l6", x: 23, y: 31 },
    { id: "z7", correctLabelId: "l7", x: 64, y: 43 },
    { id: "z8", correctLabelId: "l8", x: 65, y: 27 },
    { id: "z9", correctLabelId: "l9", x: 49, y: 38 },
    { id: "z10", correctLabelId: "l10", x: 49, y: 57 },
    { id: "z11", correctLabelId: "l11", x: 78, y: 40 },
  ],
};