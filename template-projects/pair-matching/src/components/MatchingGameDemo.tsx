import { useState, useEffect } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { type AppData } from "../types/objects";
import { MY_APP_DATA } from "../data";
import { calculateGrid } from "../config";
import { Card } from "./Card";

const MatchingGameDemo = () => {
  const [data, setData] = useState<AppData>(MY_APP_DATA);
  const [cards, setCards] = useState<any[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [mascotStatus, setMascotStatus] = useState<"idle" | "happy" | "sad">(
    "idle",
  );

  // Logic Tilt cho Grid
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 100, damping: 30 });
  const mouseY = useSpring(y, { stiffness: 100, damping: 30 });
  const rotateX = useTransform(mouseY, [-300, 300], [10, -10]);
  const rotateY = useTransform(mouseX, [-300, 300], [-10, 10]);

  useEffect(() => {
    // Khởi tạo bài: Nhân bản, xáo trộn, bù đủ grid
    const { cols, rows } = calculateGrid(data.items.length * 2);
    const totalSlots = cols * rows;

    let deck = [...data.items, ...data.items];
    while (deck.length < totalSlots) {
      deck.push(data.items[Math.floor(Math.random() * data.items.length)]);
    }

    setCards(
      deck
        .sort(() => Math.random() - 0.5)
        .map((v, i) => ({ ...v, instanceId: i })),
    );
  }, [data]);

  const handleCardClick = (index: number) => {
    if (flipped.length === 2) return;
    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      const [first, second] = newFlipped;
      if (cards[first].id === cards[second].id) {
        setMatched([...matched, cards[first].id]);
        setMascotStatus("happy");
        setFlipped([]);
        setTimeout(() => setMascotStatus("idle"), 1000);
      } else {
        setMascotStatus("sad");
        setTimeout(() => {
          setFlipped([]);
          setMascotStatus("idle");
        }, 1000);
      }
    }
  };

  const gridInfo = calculateGrid(cards.length);

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-gradient-to-br from-indigo-100 to-purple-200 overflow-hidden p-4 gap-4">
      {/* HUD: Bên trái trên PC, Bên trên trên Mobile */}
      <div className="w-full md:w-1/4 flex flex-col items-center justify-center p-6 bg-white/50 backdrop-blur rounded-3xl shadow-xl">
        <h1 className="text-2xl font-bold text-indigo-800 mb-4">
          English Matching
        </h1>

        {/* Linh vật placeholder */}
        <motion.div
          animate={{ scale: mascotStatus !== "idle" ? 1.2 : 1 }}
          className={`w-32 h-32 rounded-full flex items-center justify-center text-4xl shadow-inner
            ${mascotStatus === "happy" ? "bg-green-400" : mascotStatus === "sad" ? "bg-red-400" : "bg-blue-300"}`}
        >
          {mascotStatus === "happy"
            ? "😊"
            : mascotStatus === "sad"
              ? "😢"
              : "🤖"}
        </motion.div>

        <div className="mt-4 text-center font-medium">
          {matched.length === data.items.length && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-green-600 text-2xl font-black"
            >
              WELL-DONE!
            </motion.div>
          )}
        </div>
      </div>

      {/* GAMEPLAY: Bên phải trên PC, Bên dưới trên Mobile */}
      <div
        className="flex-1 relative flex items-center justify-center"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          x.set(e.clientX - (rect.left + rect.width / 2));
          y.set(e.clientY - (rect.top + rect.height / 2));
        }}
        onMouseLeave={() => {
          x.set(0);
          y.set(0);
        }}
      >
        <motion.div
          style={{
            rotateX,
            rotateY,
            transformStyle: "preserve-3d",
            // Tự động scale grid để luôn vừa màn hình
            width: "min(90%, 90vh)",
            aspectRatio: `${gridInfo.cols}/${gridInfo.rows}`,
            /* Tailwind không hỗ trợ dynamic grid col từ biến trực tiếp tốt, dùng style inline */
            display: "grid",
            gridTemplateColumns: `repeat(${gridInfo.cols}, 1fr)`,
            gridTemplateRows: `repeat(${gridInfo.rows}, 1fr)`,
          }}
          className="grid gap-2"
          grid-template-columns={`repeat(${gridInfo.cols}, 1fr)`}
        >
          {cards.map((card, idx) => (
            <Card
              key={idx}
              item={card}
              cardBack={data.cardBack}
              isFlipped={flipped.includes(idx)}
              isMatched={matched.includes(card.id)}
              onClick={() => handleCardClick(idx)}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default MatchingGameDemo;
