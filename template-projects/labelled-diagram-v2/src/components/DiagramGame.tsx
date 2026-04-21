import { AnimatePresence, motion } from "framer-motion";
import React, { useMemo, useState } from "react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { APP_DATA, resolveAssetUrl } from "../data";
import type { GameState } from "../types";
import "./DiagramGame.css";

const DiagramGame: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    placedPoints: {}, // targetId -> labelId
    isReviewMode: false,
    showCongratulation: false,
  });

  const [activeLabelId, setActiveLabelId] = useState<string | null>(null);

  // Points that have NOT been placed yet
  const availableLabels = useMemo(() => {
    const placedLabelIds = Object.values(gameState.placedPoints);
    return APP_DATA.points.filter((p) => !placedLabelIds.includes(p.id));
  }, [gameState.placedPoints]);

  const handleTargetClick = (pointId: string) => {
    if (gameState.isReviewMode) return;

    if (activeLabelId) {
      // Place the active label on this target
      setGameState((prev) => {
        const newPlaced = { ...prev.placedPoints };
        // If this label was already placed somewhere else, remove it
        Object.keys(newPlaced).forEach((pid) => {
          if (newPlaced[pid] === activeLabelId) delete newPlaced[pid];
        });
        newPlaced[pointId] = activeLabelId;
        return { ...prev, placedPoints: newPlaced };
      });
      setActiveLabelId(null);
    } else {
      // If clicking a target that has a label, maybe pick it back up?
      const existingLabelId = gameState.placedPoints[pointId];
      if (existingLabelId) {
        setActiveLabelId(existingLabelId);
        setGameState((prev) => {
          const newPlaced = { ...prev.placedPoints };
          delete newPlaced[pointId];
          return { ...prev, placedPoints: newPlaced };
        });
      }
    }
  };

  const handleLabelClick = (labelId: string) => {
    if (gameState.isReviewMode) return;
    setActiveLabelId((prev) => (prev === labelId ? null : labelId));
  };

  const checkResults = () => {
    if (gameState.isReviewMode) {
      setGameState((prev) => ({ ...prev, isReviewMode: false }));
      return;
    }

    const correctCount = Object.keys(gameState.placedPoints).filter(
      (targetId) => gameState.placedPoints[targetId] === targetId,
    ).length;

    const isAllCorrect = correctCount === APP_DATA.points.length;

    setGameState((prev) => ({
      ...prev,
      isReviewMode: true,
      showCongratulation: isAllCorrect,
    }));
  };

  const resetGame = () => {
    setGameState({
      placedPoints: {},
      isReviewMode: false,
      showCongratulation: false,
    });
    setActiveLabelId(null);
  };

  return (
    <div className="game-container">
      <div className="game-header">
        <h1 className="game-title">Labelled Diagram</h1>
        <div className="game-stats">
          <span className="stats-badge">
            Progress: {Object.keys(gameState.placedPoints).length} /{" "}
            {APP_DATA.points.length}
          </span>
        </div>
      </div>

      <div className="game-main">
        <div className="canvas-area">
          <TransformWrapper
            initialScale={1}
            minScale={0.5}
            maxScale={4}
            centerOnInit
            wheel={{ step: 0.1 }}
            doubleClick={{ disabled: true }}
            disabled={activeLabelId !== null} // Disable pan while dragging/selecting?
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                <div className="canvas-controls">
                  <button onClick={() => zoomIn()}>+</button>
                  <button onClick={() => zoomOut()}>-</button>
                  <button onClick={() => resetTransform()}>Reset View</button>
                </div>
                <TransformComponent
                  wrapperStyle={{ width: "100%", height: "100%" }}
                >
                  <div className="diagram-wrapper">
                    {APP_DATA.imagePath ? (
                      <img
                        src={resolveAssetUrl(APP_DATA.imagePath)}
                        alt="Diagram"
                        className="diagram-image"
                        draggable={false}
                      />
                    ) : (
                      <div className="image-placeholder">No Image Selected</div>
                    )}

                    {APP_DATA.points.map((point) => {
                      const placedLabelId = gameState.placedPoints[point.id];
                      const placedLabel = APP_DATA.points.find(
                        (p) => p.id === placedLabelId,
                      );
                      const isCorrect =
                        gameState.isReviewMode && placedLabelId === point.id;
                      const isWrong =
                        gameState.isReviewMode &&
                        placedLabelId &&
                        placedLabelId !== point.id;

                      return (
                        <div
                          key={point.id}
                          className={`target-point ${activeLabelId ? "can-drop" : ""} ${placedLabelId ? "has-label" : ""} ${isCorrect ? "correct" : ""} ${isWrong ? "wrong" : ""}`}
                          style={{
                            left: `${point.xPercent}%`,
                            top: `${point.yPercent}%`,
                          }}
                          onClick={() => handleTargetClick(point.id)}
                        >
                          <div className="target-marker"></div>
                          <AnimatePresence>
                            {placedLabel && (
                              <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                className="placed-label"
                              >
                                {placedLabel.text}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
        </div>

        <div className="labels-rack">
          <div className="rack-title">Labels</div>
          <div className="labels-list">
            <AnimatePresence>
              {availableLabels.map((label) => (
                <motion.div
                  key={label.id}
                  layout
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className={`label-item ${activeLabelId === label.id ? "active" : ""}`}
                  onClick={() => handleLabelClick(label.id)}
                >
                  {label.text}
                </motion.div>
              ))}
            </AnimatePresence>
            {availableLabels.length === 0 && (
              <div className="no-labels">All labels placed!</div>
            )}
          </div>
        </div>
      </div>

      <footer className="game-footer">
        <button
          className="btn-help"
          onClick={() =>
            alert(
              "Drag labels from the rack to the matching points on the diagram!",
            )
          }
        >
          Help
        </button>
        <button className="btn-reset" onClick={resetGame}>
          Reset
        </button>
        <button
          className={`btn-submit ${gameState.isReviewMode ? "active" : ""}`}
          onClick={checkResults}
          disabled={Object.keys(gameState.placedPoints).length === 0}
        >
          {gameState.isReviewMode ? "Continue" : "Check"}
        </button>
      </footer>

      {/* Congratulation Popup */}
      <AnimatePresence>
        {gameState.showCongratulation && (
          <motion.div
            className="popup-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() =>
              setGameState((prev) => ({ ...prev, showCongratulation: false }))
            }
          >
            <motion.div
              className="popup-content"
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.5, y: 50 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="popup-icon">🎉</div>
              <h2>Excellent!</h2>
              <p>You correctly labelled everything!</p>
              <button
                onClick={() =>
                  setGameState((prev) => ({
                    ...prev,
                    showCongratulation: false,
                  }))
                }
              >
                View Diagram
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DiagramGame;
