import { AnimatePresence, motion } from "framer-motion";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import type { GameState, GameData, CardItem } from "../types/objects";
import {
  generateCards,
  calculateGridDimensions,
  useWindowSize,
  useTiltEffect,
} from "../utils";
import { MY_APP_DATA } from "../data";

// Main Game Component
const MatchingGame: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    cards: [],
    selectedCardId: null,
    lockBoard: false,
    matchedCount: 0,
    totalPairs: 0,
    message: { type: null, text: "" },
  });

  const [gameData, setGameData] = useState<GameData>(MY_APP_DATA);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [gridDimensions, setGridDimensions] = useState({ rows: 0, cols: 0 });

  const windowSize = useWindowSize();
  const gridRef = useRef<HTMLDivElement>(null);
  const { tiltStyle, handleMouseMove, handleMouseLeave } =
    useTiltEffect(gridRef);

  // Load game data from window object
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).MY_APP_DATA) {
      setGameData((window as any).MY_APP_DATA);
    }
  }, []);

  // Initialize game
  useEffect(() => {
    const newCards = generateCards(gameData);
    const totalPairs = newCards.filter((card) => !card.isMatched).length / 2;

    setGameState((prev) => ({
      ...prev,
      cards: newCards,
      totalPairs,
      matchedCount: 0,
      selectedCardId: null,
    }));
    setIsGameComplete(false);
  }, [gameData]);

  // Update grid dimensions when cards change
  useEffect(() => {
    if (gameState.cards.length > 0) {
      const { rows, cols } = calculateGridDimensions(gameState.cards.length);
      setGridDimensions({ rows, cols });
    }
  }, [gameState.cards]);

  // Check game completion
  useEffect(() => {
    if (
      gameState.matchedCount === gameState.totalPairs &&
      gameState.totalPairs > 0
    ) {
      setIsGameComplete(true);
    }
  }, [gameState.matchedCount, gameState.totalPairs]);

  const showMessage = useCallback((type: "success" | "error", text: string) => {
    setGameState((prev) => ({ ...prev, message: { type, text } }));
    setTimeout(() => {
      setGameState((prev) => ({ ...prev, message: { type: null, text: "" } }));
    }, 1500);
  }, []);

  const handleCardClick = useCallback(
    async (clickedCard: CardItem) => {
      if (
        gameState.lockBoard ||
        clickedCard.isFlipped ||
        clickedCard.isMatched ||
        isGameComplete
      ) {
        return;
      }

      const { selectedCardId, cards } = gameState;

      // First card selection
      if (selectedCardId === null) {
        setGameState((prev) => ({
          ...prev,
          cards: prev.cards.map((card) =>
            card.id === clickedCard.id ? { ...card, isFlipped: true } : card,
          ),
          selectedCardId: clickedCard.id,
        }));
        return;
      }

      // Second card selection
      const selectedCard = cards.find((card) => card.id === selectedCardId);
      if (!selectedCard || selectedCard.id === clickedCard.id) return;

      setGameState((prev) => ({
        ...prev,
        lockBoard: true,
        cards: prev.cards.map((card) =>
          card.id === clickedCard.id ? { ...card, isFlipped: true } : card,
        ),
      }));

      // Check match
      const isMatch = selectedCard.imageSrc === clickedCard.imageSrc;

      if (isMatch) {
        // Match found
        showMessage("success", "Great match! 🎉");

        setTimeout(() => {
          setGameState((prev) => ({
            ...prev,
            cards: prev.cards.map((card) =>
              card.id === selectedCard.id || card.id === clickedCard.id
                ? { ...card, isMatched: true, isFlipped: false }
                : card,
            ),
            selectedCardId: null,
            lockBoard: false,
            matchedCount: prev.matchedCount + 1,
          }));
        }, 500);
      } else {
        // Match failed
        showMessage("error", "Try again! 😢");

        setTimeout(() => {
          setGameState((prev) => ({
            ...prev,
            cards: prev.cards.map((card) =>
              card.id === selectedCard.id || card.id === clickedCard.id
                ? { ...card, isFlipped: false }
                : card,
            ),
            selectedCardId: null,
            lockBoard: false,
          }));
        }, 800);
      }
    },
    [gameState, isGameComplete, showMessage],
  );

  const resetGame = useCallback(() => {
    const newCards = generateCards(gameData);
    setGameState({
      cards: newCards,
      selectedCardId: null,
      lockBoard: false,
      matchedCount: 0,
      totalPairs: newCards.filter((card) => !card.isMatched).length / 2,
      message: { type: null, text: "" },
    });
    setIsGameComplete(false);
  }, [gameData]);

  // Calculate card size based on container
  const cardSize = useMemo(() => {
    if (!gridRef.current || gridDimensions.rows === 0) return 120;
    const container = gridRef.current.parentElement;
    if (!container) return 120;

    const maxHeight = windowSize.height * 0.6;
    const maxWidth = windowSize.width * 0.7;

    const cardHeight = maxHeight / gridDimensions.rows;
    const cardWidth = maxWidth / gridDimensions.cols;

    return Math.min(cardHeight, cardWidth, 150);
  }, [windowSize, gridDimensions]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-300 to-blue-400 overflow-hidden">
      {/* Game Container */}
      <div className="container mx-auto px-4 py-6 h-screen flex flex-col lg:flex-row gap-6">
        {/* HUD Section */}
        <div className="lg:w-80 flex flex-col gap-4">
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="bg-white/90 backdrop-blur rounded-2xl p-6 shadow-xl"
          >
            <h2 className="text-2xl font-bold text-purple-600 mb-4">
              Memory Match
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Progress:</span>
                <div className="flex-1 mx-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(gameState.matchedCount / gameState.totalPairs) * 100}%`,
                    }}
                    className="h-full bg-gradient-to-r from-green-400 to-blue-500"
                  />
                </div>
                <span className="font-bold text-purple-600">
                  {gameState.matchedCount}/{gameState.totalPairs}
                </span>
              </div>

              <div className="text-center text-2xl font-bold">
                {gameState.matchedCount === gameState.totalPairs &&
                gameState.totalPairs > 0 ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-green-500"
                  >
                    🎉 Well-done! 🎉
                  </motion.div>
                ) : (
                  <span>Match the pairs!</span>
                )}
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetGame}
              className="mt-6 w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              New Game 🔄
            </motion.button>
          </motion.div>

          {/* Pet/Mascot Message */}
          <motion.div
            animate={{
              scale: gameState.message.type === "success" ? [1, 1.2, 1] : 1,
              rotate: gameState.message.type === "error" ? [0, -10, 10, 0] : 0,
            }}
            transition={{ duration: 0.3 }}
            className="bg-white/90 backdrop-blur rounded-2xl p-6 shadow-xl text-center"
          >
            {gameState.message.type === "success" && (
              <div className="text-4xl">😊🎉</div>
            )}
            {gameState.message.type === "error" && (
              <div className="text-4xl">😢💔</div>
            )}
            {!gameState.message.type && <div className="text-4xl">🐶</div>}
            <p
              className={`mt-2 font-bold ${
                gameState.message.type === "success"
                  ? "text-green-500"
                  : gameState.message.type === "error"
                    ? "text-red-500"
                    : "text-gray-600"
              }`}
            >
              {gameState.message.text || "Find matching pairs!"}
            </p>
          </motion.div>
        </div>

        {/* Game Grid Section */}
        <div
          className="flex-1 flex items-center justify-center perspective-1000"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <motion.div
            ref={gridRef}
            style={{
              ...tiltStyle,
              transformStyle: "preserve-3d",
            }}
            className="relative"
          >
            <div
              className="grid gap-3 p-4 bg-white/20 backdrop-blur rounded-3xl shadow-2xl"
              style={{
                gridTemplateColumns: `repeat(${gridDimensions.cols}, minmax(${cardSize}px, ${cardSize}px))`,
                gridTemplateRows: `repeat(${gridDimensions.rows}, minmax(${cardSize}px, ${cardSize}px))`,
              }}
            >
              <AnimatePresence>
                {gameState.cards.map((card) => (
                  <motion.div
                    key={card.id}
                    initial={{ rotateY: 0, scale: 1 }}
                    animate={{
                      rotateY: card.isFlipped || card.isMatched ? 180 : 0,
                      scale: card.isMatched ? 0 : 1,
                    }}
                    exit={{ scale: 0 }}
                    transition={{
                      duration: 0.4,
                      type: "spring",
                      stiffness: 200,
                    }}
                    whileHover={{ scale: card.isMatched ? 0 : 1.05 }}
                    onClick={() => handleCardClick(card)}
                    className={`relative cursor-pointer rounded-xl shadow-lg ${
                      card.isMatched ? "pointer-events-none" : ""
                    }`}
                    style={{
                      width: cardSize,
                      height: cardSize,
                      transformStyle: "preserve-3d",
                    }}
                  >
                    {/* Card Front */}
                    <div
                      className={`absolute inset-0 rounded-xl flex items-center justify-center text-4xl font-bold
                        bg-gradient-to-br from-yellow-400 to-orange-500 backface-hidden
                        shadow-inner border-4 border-white`}
                      style={{ transform: "rotateY(0deg)" }}
                    >
                      {gameData.cardBackImage || "🎴"}
                    </div>

                    {/* Card Back */}
                    <div
                      className={`absolute inset-0 rounded-xl flex items-center justify-center
                        bg-gradient-to-br from-blue-500 to-purple-600 backface-hidden
                        shadow-inner border-4 border-white`}
                      style={{
                        transform: "rotateY(180deg)",
                        backgroundImage: card.imageSrc.startsWith("http")
                          ? `url(${card.imageSrc})`
                          : "none",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    >
                      {!card.imageSrc.startsWith("http") && (
                        <div className="text-5xl">{card.imageSrc}</div>
                      )}
                      {card.isMatched && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center"
                        >
                          <div className="text-white font-bold text-xl">
                            {card.keyword}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Celebration Animation */}
      <AnimatePresence>
        {isGameComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.6 }}
              className="bg-white/90 backdrop-blur rounded-2xl p-8 text-center shadow-2xl"
            >
              <div className="text-6xl mb-4">🎉✨🏆✨🎉</div>
              <h2 className="text-3xl font-bold text-purple-600 mb-2">
                Well-done!
              </h2>
              <p className="text-gray-600">You're a memory champion!</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MatchingGame;
