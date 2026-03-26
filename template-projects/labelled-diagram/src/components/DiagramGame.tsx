import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useState } from "react";
import { AnimatePresence } from "framer-motion";

import type { DiagramData, Label } from "../types/diagram";
import DiagramBoard from "./DiagramBoard";
import DraggableItem, { ItemCard } from "./DraggableItem";
import GameFeedback from "./GameFeedback";
import { aiIdentifier } from "../services/bodyPartIdentifier";
import { advancedIdentifier } from "../services/advancedBodyPartIdentifier";

interface Props {
  data: DiagramData;
}

const DiagramGame: React.FC<Props> = ({ data }) => {
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [activeLabel, setActiveLabel] = useState<Label | null>(null);
  const [suggestion, setSuggestion] = useState<string>("");
  const [learningContent, setLearningContent] = useState<string>("");

  const handleDragStart = (event: DragStartEvent) => {
    setActiveLabel(event.active.data.current as Label);
    setSuggestion(""); // Clear suggestion on new drag
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveLabel(null);

    if (!over) return;

    const zoneId = over.id as string;
    const label = active.data.current as Label;
    const zone = data.zones.find((z) => z.id === zoneId);

    if (zone) {
      setPlaced((prev) => ({
        ...prev,
        [zoneId]: label.id,
      }));

      // Generate AI verification with learning content
      const isCorrect = label.id === zone.correctLabelId;
      const verification = advancedIdentifier.enhancedVerification(
        label.name,
        data.labels.find(l => l.id === zone.correctLabelId)?.name || "",
        isCorrect
      );

      if (isCorrect) {
        // Generate learning content for correct placements
        const learning = advancedIdentifier.generateLearningContent(label.name);
        setLearningContent(learning);
        setTimeout(() => setLearningContent(""), 4000);
      } else {
        // Show AI insight for incorrect placements
        setSuggestion(verification.aiInsight);
        setTimeout(() => setSuggestion(""), 5000);
      }
    }
  };

  const usedLabels = Object.values(placed);
  const remainingLabels = data.labels.filter((l) => !usedLabels.includes(l.id));

  // Get AI hint for next label
  const nextZone = data.zones.find((zone) => !placed[zone.id]);
  const nextLabel = nextZone ? data.labels.find(l => l.id === nextZone.correctLabelId) : null;
  const hint = nextLabel
    ? aiIdentifier.getSuggestion(remainingLabels, nextLabel.name)
    : null;

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 p-3 sm:p-4 md:p-6 min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Sidebar */}
        <div className="w-60 max-h-[90vh] overflow-y-auto pr-2">
          <div className="p-2 sticky top-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>🏷️</span>Body Parts<span>🏷️</span>
            </h2>

            {/* Hint System */}
            {hint && nextZone && remainingLabels.length <= 3 && !learningContent && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-xs font-semibold text-yellow-800 mb-2">
                  💡 Next Hint
                </p>
                <p className="text-sm text-yellow-900">
                  Try placing <span className="font-bold">{hint.name}</span> in the next zone
                </p>
              </div>
            )}

            {/* Labels Grid */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Remaining: {remainingLabels.length} / {data.labels.length}
              </div>
              <AnimatePresence>
                {remainingLabels.map((label) => (
                  <DraggableItem key={label.id} item={label as any} />
                ))}
              </AnimatePresence>

              {remainingLabels.length === 0 && (
                <div className="text-center py-8 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
                  <p className="text-2xl mb-2">🎉</p>
                  <p className="text-lg font-bold text-green-600">
                    All labeled!
                  </p>
                  <p className="text-sm text-green-600 mt-2">
                    Great anatomy knowledge!
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition"
                  >
                    Play Again
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Diagram */}
        <div className="flex justify-center items-center">
          <div className="inline-block bg-white p-6 rounded-3xl shadow-xl">
            <DiagramBoard data={data} placed={placed} />
          </div>
        </div>
      </div>

      {/* Game Feedback Panel */}
      <GameFeedback data={data} placed={placed} />

      <DragOverlay>
        {activeLabel ? <ItemCard item={activeLabel as any} /> : null}
      </DragOverlay>
    </DndContext>
  );
};

export default DiagramGame;