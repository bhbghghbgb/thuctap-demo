import { useEffect, useState } from "react";
import type { CardItem, GameData } from "../types/objects";

// Helper function to shuffle array
export const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Helper to calculate optimal grid dimensions
export const calculateGridDimensions = (
  totalCards: number,
): { rows: number; cols: number } => {
  const ratio = 4 / 3; // Width to height ratio preference
  let cols = Math.ceil(Math.sqrt(totalCards * ratio));
  let rows = Math.ceil(totalCards / cols);

  // Adjust to make it more balanced
  while (rows > cols * 1.5 && rows > 2) {
    cols++;
    rows = Math.ceil(totalCards / cols);
  }

  return { rows, cols };
};

// Generate cards from game data
export const generateCards = (gameData: GameData): CardItem[] => {
  let items = [...gameData.items];
  const minPairs = gameData.minPairs || 8;

  // Ensure enough pairs
  while (items.length < minPairs) {
    items = [...items, ...gameData.items.slice(0, minPairs - items.length)];
  }

  // Create pairs
  let pairs: { imageSrc: string; keyword: string }[] = [];
  items.forEach((item) => {
    pairs.push(item, item); // Create pair
  });

  // Adjust to make grid rectangular
  const totalCards = pairs.length;
  const { rows, cols } = calculateGridDimensions(totalCards);
  const targetTotal = rows * cols;

  if (targetTotal > totalCards) {
    const extraNeeded = targetTotal - totalCards;
    for (let i = 0; i < extraNeeded; i++) {
      const randomItem = items[i % items.length];
      pairs.push(randomItem, randomItem);
    }
  }

  // Shuffle and create cards
  const shuffledPairs = shuffleArray(pairs);
  return shuffledPairs.map((pair, index) => ({
    id: `${index}-${Date.now()}`,
    imageSrc: pair.imageSrc,
    keyword: pair.keyword,
    isFlipped: false,
    isMatched: false,
  }));
};

export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowSize;
};

export const useTiltEffect = (ref: React.RefObject<HTMLElement | null>) => {
  const [tiltStyle, setTiltStyle] = useState({});

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const x = (e.clientX - left) / width;
    const y = (e.clientY - top) / height;

    const rotateX = (y - 0.5) * 20;
    const rotateY = (x - 0.5) * 20;

    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`,
      transition: "transform 0.1s ease-out",
    });
  };

  const handleMouseLeave = () => {
    setTiltStyle({
      transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)",
      transition: "transform 0.3s ease-out",
    });
  };

  return { tiltStyle, handleMouseMove, handleMouseLeave };
};
