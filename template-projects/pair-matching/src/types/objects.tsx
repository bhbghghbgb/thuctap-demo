// --- Định nghĩa kiểu dữ liệu ---
// types.ts
export interface CardItem {
  id: string;
  imageSrc: string;
  keyword: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export interface GameData {
  items: {
    imageSrc: string;
    keyword: string;
  }[];
  minPairs?: number;
  cardBackImage?: string;
}

export interface GameState {
  cards: CardItem[];
  selectedCardId: string | null;
  lockBoard: boolean;
  matchedCount: number;
  totalPairs: number;
  message: { type: "success" | "error" | null; text: string };
}
