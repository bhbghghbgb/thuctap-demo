import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useState } from "react";

import type { DiagramData, Label } from "../types/diagram";
import DiagramBoard from "./DiagramBoard";
import { ItemCard } from "./DraggableItem";
import DraggableItem from "./DraggableItem";
import GameFeedback from "./GameFeedback";
import { advancedIdentifier } from "../services/advancedBodyPartIdentifier";

interface Props {
  data: DiagramData;
}

const DiagramGame: React.FC<Props> = ({ data }) => {
  const [gameData, setGameData] = useState<DiagramData>(data);
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [activeLabel, setActiveLabel] = useState<Label | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<{ x: number; y: number } | null>(null);
  const [newLabelName, setNewLabelName] = useState<string>("");
  const [pendingLabels, setPendingLabels] = useState<Array<{ name: string; x: number; y: number }>>([]);
  const [labelsCompleted, setLabelsCompleted] = useState<boolean>(false);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveLabel(event.active.data.current as Label);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveLabel(null);

    if (!over) return;

    const zoneId = over.id as string;
    const label = active.data.current as Label;
    const zone = gameData.zones.find((z) => z.id === zoneId);

    if (zone) {
      setPlaced((prev) => ({
        ...prev,
        [zoneId]: label.id,
      }));

      // Generate AI verification with learning content
      const isCorrect = label.id === zone.correctLabelId;

      if (isCorrect) {
        // Generate learning content for correct placements
        advancedIdentifier.generateLearningContent(label.name);
        // Note: learning content could be displayed in GameFeedback or another component
      }
    }
  };

  // Calculate remaining labels for drag-and-drop game
  const usedLabels = Object.values(placed);
  const remainingLabels = gameData.labels.filter((l) => !usedLabels.includes(l.id));

  // Check if game is complete (all labels placed correctly)
  const isGameComplete = gameData.labels.length > 0 && remainingLabels.length === 0 && Object.keys(placed).length === gameData.zones.length;

  const handleCompleteLabels = () => {
    const newLabels = pendingLabels.map((pending, index) => ({
      id: `l${gameData.labels.length + index + 1}`,
      name: pending.name,
    }));
    const newZones = pendingLabels.map((pending, index) => ({
      id: `z${gameData.zones.length + index + 1}`,
      correctLabelId: `l${gameData.labels.length + index + 1}`,
      x: pending.x,
      y: pending.y,
    }));
    setGameData((prev) => ({
      ...prev,
      labels: [...prev.labels, ...newLabels],
      zones: [...prev.zones, ...newZones],
    }));
    setPendingLabels([]);
    setSelectedPoint(null); // clear selected marker when labels are finalized
    setLabelsCompleted(true);
  };

  const handlePlayAgain = () => {
    // reset game data to initial state (keep id/name from the original diagram data)
    setGameData({
      ...data,
      imagePath: "",
      labels: [],
      zones: [],
    });
    setPlaced({});
    setLabelsCompleted(false);
    setSelectedPoint(null);
    setNewLabelName("");
    setPendingLabels([]);
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center p-10">
        <div className="w-[1200px] h-[800px] translate-x-20 bg-white/5 rounded-2xl shadow-2xl p-6 flex flex-row gap-6">
          {/* Sidebar */}
          <div className="w-80 max-h-[90vh] overflow-y-auto pr-2">
            <div className="p-2 sticky top-6 max-h-[90vh] overflow-y-auto space-y-4">
              {!labelsCompleted && (
                <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-5 shadow-elevated border border-purple-500/50 animate-slide-up">
                  <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <span className="text-2xl animate-bounce">📤</span>
                    Step 1: Upload Image
                  </h2>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      const blob = URL.createObjectURL(file);
                      setGameData((prev) => ({ ...prev, imagePath: blob }));
                      setSelectedPoint(null);
                    }}
                    className="mb-3 w-full text-sm border-2 border-purple-300 rounded-lg p-3 focus:border-purple-200 focus:outline-none bg-white/10 text-white placeholder-purple-200 transition"
                  />
                  {selectedPoint && (
                    <div className="text-xs text-emerald-200 mb-2 bg-emerald-500/20 p-3 rounded-lg border border-emerald-400/50 flex items-center gap-2">
                      <span className="text-lg">✅</span>
                      Selected: [{selectedPoint.x.toFixed(1)}%, {selectedPoint.y.toFixed(1)}%]
                    </div>
                  )}
                </div>
              )}

              {gameData.imagePath && !labelsCompleted && (
                <div className="bg-gradient-to-br from-cyan-600 to-cyan-700 rounded-2xl p-5 shadow-elevated border border-cyan-500/50 animate-slide-up">
                  <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <span className="text-lg animate-spin">🎯</span>
                    Step 2: Create Labels
                  </h2>
                  <div className="flex gap-2 mb-3">
                    <input
                      value={newLabelName}
                      onChange={(e) => setNewLabelName(e.target.value)}
                      placeholder="Enter label name"
                      className="flex-1 px-3 py-2 border-2 border-cyan-300 rounded-lg text-sm focus:border-cyan-200 focus:outline-none bg-white/10 text-white placeholder-cyan-200 transition"
                      disabled={!selectedPoint}
                    />
                    <button
                      onClick={() => {
                        if (!selectedPoint || !newLabelName.trim() || pendingLabels.length >= 10) return;
                        setPendingLabels((prev) => [
                          ...prev,
                          {
                            name: newLabelName.trim(),
                            x: Number(selectedPoint.x.toFixed(2)),
                            y: Number(selectedPoint.y.toFixed(2)),
                          },
                        ]);
                        setNewLabelName("");
                        setSelectedPoint(null);
                      }}
                      disabled={!selectedPoint || !newLabelName.trim() || pendingLabels.length >= 10}
                      className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-semibold hover:bg-emerald-600 disabled:bg-gray-500 disabled:cursor-not-allowed transition active:scale-95 shadow-soft"
                    >
                      Add Label ({pendingLabels.length}/10)
                    </button>
                  </div>

                  {pendingLabels.length > 0 && (
                    <div className="mt-3 bg-white/10 rounded-xl p-3 border border-cyan-300/50">
                      <h4 className="text-sm font-semibold text-cyan-100 mb-2">📋 Your Labels:</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {pendingLabels.map((label, index) => (
                          <div key={index} className="flex justify-between items-center bg-white/15 p-2 rounded-lg text-xs text-white border border-cyan-300/30 hover:bg-white/20 transition">
                            <span className="font-medium">{label.name}</span>
                            <button
                              onClick={() => {
                                setPendingLabels((prev) => prev.filter((_, i) => i !== index));
                              }}
                              className="text-red-300 hover:text-red-200 ml-2 text-lg transition active:scale-110"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={handleCompleteLabels}
                        className="mt-3 w-full px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg text-sm font-semibold hover:from-emerald-600 hover:to-teal-600 transition shadow-soft active:scale-95"
                      >
                        ✨ Complete ({pendingLabels.length} labels)
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* {gameData.imagePath && labelsCompleted && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 shadow-sm">
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-blue-800 mb-2">✅ Labels Created</h3>
                    <p className="text-sm text-blue-700 mb-3">
                      {gameData.labels.length} label{gameData.labels.length !== 1 ? 's' : ''} have been created. You can now play the labeling game!
                    </p>
                    <button
                      onClick={handlePlayAgain}
                      className="px-4 py-2 bg-orange-500 text-white rounded text-sm font-semibold hover:bg-orange-600 transition"
                    >
                      🔄 Play Again
                    </button>
                  </div>
                </div>
              )} */}

            </div>
          </div>

          {/* Main Game Area */}
          <div className="flex flex gap-6 items-start">
            
            {/* Diagram */}
            <div className="flex justify-flex items-flex flex-col">
              <div className="inline-block bg-white/10 backdrop-blur-md p-6 rounded-2xl shadow-elevated border border-white/20 hover:border-white/30 transition">
                <DiagramBoard
                  data={gameData}
                  placed={placed}
                  selectedPoint={selectedPoint}
                  onZoneSelect={labelsCompleted ? undefined : setSelectedPoint}
                />
              </div>
            </div>

            {/* Labels Column - Right side of image */}
            {gameData.labels.length > 0 && (
              <div className="w-72 bg-white/10 backdrop-blur-md rounded-2xl p-5 shadow-elevated border border-white/20 overflow-hidden flex flex-col max-h-[70vh]">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-xl animate-float">🏷️</span>
                  <span className="bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">Labels</span>
                </h2>
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {remainingLabels.map((label) => (
                    <DraggableItem key={label.id} item={label} />
                  ))}
                </div>

                {/* Game Complete - Again Button */}
                {isGameComplete && (
                  <div className="mt-6 pt-6 border-t border-white/20">
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-5 mb-4 shadow-elevated animate-pulse-glow border border-emerald-400/50">
                      <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                        <span className="text-2xl">🎉</span>Congratulations!
                      </h3>
                      <p className="text-emerald-50 text-sm">You have successfully completed the labeling game!</p>
                    </div>
                    <button
                      onClick={() => window.location.reload()}
                      className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition active:scale-95 shadow-soft"
                    >
                      Play Again
                    </button>
                  </div>
                )}
              </div>
            )}
            </div>
          </div>
          </div>

      {/* Game Feedback Panel */}
      <GameFeedback data={gameData} placed={placed} />

      <DragOverlay>
        {activeLabel ? <ItemCard item={activeLabel} /> : null}
      </DragOverlay>
    </DndContext>
  );
};

export default DiagramGame;