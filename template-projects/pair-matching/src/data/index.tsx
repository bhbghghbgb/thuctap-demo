import type { AppData } from "../types/objects";

// --- Dữ liệu mẫu ---
export const MY_APP_DATA: AppData =
  import.meta.env.PROD &&
  (window as Window & typeof globalThis & { MY_APP_DATA: AppData })[
    "MY_APP_DATA"
  ]
    ? (
        window as Window &
          typeof globalThis & {
            MY_APP_DATA: AppData;
          }
      )["MY_APP_DATA"]
    : {
        cardBack: "https://via.placeholder.com/150/0000FF/FFFFFF?text=?",
        items: [
          {
            id: 1,
            image: "https://cdn-icons-png.flaticon.com/512/2909/2909761.png",
            keyword: "Apple",
          },
          {
            id: 2,
            image: "https://cdn-icons-png.flaticon.com/512/2909/2909808.png",
            keyword: "Banana",
          },
          // Thêm data mẫu...
        ],
      };
