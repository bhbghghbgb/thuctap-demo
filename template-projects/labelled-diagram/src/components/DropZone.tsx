import { useDroppable } from "@dnd-kit/core";
import { AnimatePresence, motion } from "framer-motion";
import { layoutTransition } from "../config";
import { advancedIdentifier } from "../services/advancedBodyPartIdentifier";
import type { Zone, Label } from "../types/diagram";

interface Props {
  zone: Zone;
  label?: Label;
  isCorrect?: boolean;
  correctLabelId?: string;
  showAnnotations?: boolean;
}

const DropZone: React.FC<Props> = ({ zone, label, isCorrect, correctLabelId, showAnnotations = true }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: zone.id,
  });

  // Get advanced AI feedback if label is placed
  let advancedFeedback = "";
  if (label && correctLabelId) {
    const result = advancedIdentifier.enhancedVerification(
      label.name,
      label.name,
      label.id === correctLabelId
    );
    advancedFeedback = result.aiInsight;
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        position: "absolute",
        left: `${zone.x}%`,
        top: `${zone.y}%`,
        transform: "translate(-50%, -50%)",
      }}
      className={`px-3 py-2 flex flex-col items-center justify-center rounded-lg border-2 transition-all relative group shadow-md ${
        showAnnotations
          ? isOver
            ? "border-cyan-400 bg-cyan-400/20 ring-2 ring-cyan-300/50 scale-125 shadow-elevated"
            : isCorrect === true
            ? "border-emerald-400 bg-emerald-400/15 shadow-lg shadow-emerald-500/30"
            : isCorrect === false
            ? "border-red-400 bg-red-400/15 shadow-lg shadow-red-500/30"
            : "border-purple-300/50 bg-purple-400/10 hover:border-purple-400"
          : "border-transparent bg-transparent shadow-none"
      } ${!showAnnotations ? "pointer-events-auto" : ""}`}
    >
      {/* Zone placeholder indicator */}
      {showAnnotations && !label && (
        <div className="flex flex-col items-center justify-center bg-white/15 rounded-lg px-3 py-2 border border-purple-300/50 shadow-sm">
          <div className="text-lg text-purple-300 animate-pulse">⭕</div>
        </div>
      )}

      <AnimatePresence mode="popLayout">
        {showAnnotations && label && (
          <motion.div
            key={label.id}
            layoutId={label.id}
            initial={{ scale: 0.5, opacity: 0, rotateZ: -10 }}
            animate={{ scale: 1, opacity: 1, rotateZ: 0 }}
            exit={{ scale: 0.5, opacity: 0, rotateZ: 10 }}
            transition={layoutTransition}
            className="flex flex-col items-center justify-center"
          >
            <div className="text-sm font-bold text-center line-clamp-2 text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg px-3 py-2 border border-purple-400/50 shadow-soft">
              {label.name}
            </div>

            {/* Correct indicator */}
            {isCorrect === true && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 bg-gradient-to-br from-emerald-400 to-teal-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg"
              >
                ✓
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Insight tooltip - modern style */}
      {showAnnotations && advancedFeedback && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 w-56 bg-gradient-to-br from-amber-400 to-orange-500 text-gray-900 text-xs rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-normal shadow-elevated border border-amber-300/50 font-semibold">
          <p className="mb-1">🧠 AI Insight:</p>
          <p>{advancedFeedback}</p>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-amber-400"></div>
        </div>
      )}
    </div>
  );
};

export default DropZone;