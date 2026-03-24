// --- Định nghĩa kiểu dữ liệu ---
// types.ts
export interface GameItem {
  id: string | number;
  image: string;
  keyword: string;
  minAppearances?: number;
}

export interface AppData {
  items: GameItem[];
  cardBack: string;
}
