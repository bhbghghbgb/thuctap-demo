import { useDraggable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import type { Label } from "../types/diagram";
import { layoutTransition } from "../config";

interface Props {
  item: Label;
  isDragging?: boolean;
}

// Component hiển thị UI thuần túy
export const ItemCard: React.FC<Props & { style?: React.CSSProperties }> = ({
  item,
  isDragging,
  style,
}) => (
  <motion.div
    layoutId={item.id}
    className={`w-32 h-20 shrink-0 flex items-center justify-center border-4 border-purple-400 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-elevated select-none cursor-grab active:cursor-grabbing transition-all ${
      isDragging ? "opacity-50 scale-90 shadow-none" : "opacity-100 scale-100 hover:shadow-glow hover:border-purple-300"
    }`}
    style={style}
    transition={layoutTransition}
  >
    <input
      type="text"
      value={item.name}
      readOnly
      className="w-full text-center px-2 py-1 bg-transparent outline-none font-bold text-white cursor-grab text-sm"
    />
  </motion.div>
);

const DraggableItem: React.FC<{ item: Label }> = ({ item }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item.id,
    data: item,
  });

  return (
    <div ref={setNodeRef} {...listeners} {...attributes}>
      <ItemCard item={item} isDragging={isDragging} />
    </div>
  );
};

export default DraggableItem;