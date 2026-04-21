export interface LabelledDiagramPoint {
  id: string;
  text: string;
  xPercent: number;
  yPercent: number;
}

export interface LabelledDiagramAppData {
  imagePath: string | null;
  points: LabelledDiagramPoint[];
  _pointCounter: number;
}

export interface GameState {
  placedPoints: Record<string, string>; // targetId -> labelId
  isReviewMode: boolean;
  showCongratulation: boolean;
  interactionMode: "click" | "drag";
}
