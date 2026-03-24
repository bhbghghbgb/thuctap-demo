import type { GameData } from "../types/objects";

const defaultGameData: GameData = {
  items: [
    { imageSrc: "🐶", keyword: "DOG" },
    { imageSrc: "🐱", keyword: "CAT" },
    { imageSrc: "🐭", keyword: "MOUSE" },
    { imageSrc: "🐹", keyword: "HAMSTER" },
    { imageSrc: "🐰", keyword: "RABBIT" },
    { imageSrc: "🦊", keyword: "FOX" },
  ],
  minPairs: 8,
  cardBackImage: "🎴",
};
// --- Dữ liệu mẫu ---
export const MY_APP_DATA: GameData =
  import.meta.env.PROD &&
  (window as Window & typeof globalThis & { MY_APP_DATA: GameData })[
    "MY_APP_DATA"
  ]
    ? (
        window as Window &
          typeof globalThis & {
            MY_APP_DATA: GameData;
          }
      )["MY_APP_DATA"]
    : defaultGameData;
