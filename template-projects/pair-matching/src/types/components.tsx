import type { GameItem } from "./objects";

export interface CardProps {
  item: GameItem;
  isFlipped: boolean;
  isMatched: boolean;
  cardBack: string;
  onClick: () => void;
}
