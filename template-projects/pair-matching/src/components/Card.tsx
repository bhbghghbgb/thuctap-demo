import { motion } from "framer-motion";
import type { CardProps } from "../types/components";

const Card = ({ item, isFlipped, isMatched, cardBack, onClick }: CardProps) => {
  return (
    <div className="relative w-full h-full perspective-1000 p-1">
      <motion.div
        className="w-full h-full relative preserve-3d cursor-pointer"
        animate={{ rotateY: isFlipped || isMatched ? 180 : 0 }}
        transition={{
          duration: 0.6,
          type: "spring",
          stiffness: 260,
          damping: 20,
        }}
        onClick={!isFlipped && !isMatched ? onClick : undefined}
      >
        {/* Mặt sau (Lúc chưa lật) */}
        <div className="absolute inset-0 backface-hidden rounded-xl bg-blue-400 border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
          <img
            src={cardBack}
            alt="back"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Mặt trước (Hình ảnh) */}
        <motion.div
          className="absolute inset-0 backface-hidden rotateY-180 rounded-xl bg-white border-4 border-yellow-400 shadow-lg flex items-center justify-center"
          animate={{ opacity: isMatched ? 0 : 1 }}
        >
          <img
            src={item.image}
            alt={item.keyword}
            className="w-[80%] h-[80%] object-contain"
          />
        </motion.div>

        {/* Lớp hiển thị Keyword sau khi Match */}
        <motion.div
          className="absolute inset-0 rotateY-180 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: isMatched ? 1 : 0 }}
        >
          <span className="text-4xl font-black text-purple-600 drop-shadow-md">
            {item.keyword.charAt(0).toUpperCase()}
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
};

export { Card };
