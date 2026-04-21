import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { AnimatePresence, motion } from "framer-motion";
import React, { useMemo, useRef, useState } from "react";
import {
  TransformComponent,
  TransformWrapper,
  type ReactZoomPanPinchRef,
} from "react-zoom-pan-pinch";
import { APP_DATA, resolveAssetUrl } from "../data";
import type { GameState, LabelledDiagramPoint } from "../types";
import "./DiagramGame.css";

// --- Sub-components ---

const GameHeader: React.FC<{
  progress: number;
  total: number;
  onHelp: () => void;
  onReset: () => void;
}> = ({ progress, total, onHelp, onReset }) => (
  <header className="game-header">
    <div className="game-title-group">
      <h1 className="game-title">Labelled Diagram</h1>
      <div className="stats-badge">
        Completed: {progress} / {total}
      </div>
    </div>
    <div className="header-controls">
      <button className="btn-header help" onClick={onHelp}>
        <span>❓</span> Help
      </button>
      <button className="btn-header reset" onClick={onReset}>
        <span>🔄</span> Reset
      </button>
    </div>
  </header>
);

const AnnotationPoint: React.FC<{
  point: LabelledDiagramPoint;
  isCorrect: boolean;
  isWrong: boolean;
  hasLabel: boolean;
  placedLabelText?: string;
  canDrop: boolean;
  onClick: () => void;
  // Position passed from parent
  style: React.CSSProperties;
}> = ({
  isCorrect,
  isWrong,
  hasLabel,
  placedLabelText,
  canDrop,
  onClick,
  style,
}) => {
  return (
    <div
      className={`target-point ${canDrop ? "can-drop" : ""} ${hasLabel ? "has-label" : ""} ${isCorrect ? "correct" : ""} ${isWrong ? "wrong" : ""}`}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <div className="target-marker" />
      <AnimatePresence>
        {placedLabelText && (
          <motion.div
            initial={{ scale: 0, opacity: 0, y: 10, x: "-50%" }}
            animate={{ scale: 1, opacity: 1, y: 0, x: "-50%" }}
            exit={{ scale: 0, opacity: 0, y: 10, x: "-50%" }}
            className="placed-label"
          >
            {placedLabelText}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Main Game Component ---

const DiagramGame: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    placedPoints: {},
    isReviewMode: false,
    showCongratulation: false,
    interactionMode: "click",
  });

  const [activeLabelId, setActiveLabelId] = useState<string | null>(null);
  const [imgSize, setImgSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [transform, setTransform] = useState({
    scale: 1,
    positionX: 0,
    positionY: 0,
  });

  const transformRef = useRef<ReactZoomPanPinchRef>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const availableLabels = useMemo(() => {
    const placedLabelIds = Object.values(gameState.placedPoints);
    let items = APP_DATA.points.filter((p) => !placedLabelIds.includes(p.id));

    if (gameState.interactionMode === "click" && activeLabelId) {
      const activeItem = items.find((p) => p.id === activeLabelId);
      if (activeItem) {
        items = [activeItem, ...items.filter((p) => p.id !== activeLabelId)];
      }
    }
    return items;
  }, [gameState.placedPoints, activeLabelId, gameState.interactionMode]);

  const handleTargetClick = (pointId: string) => {
    if (gameState.isReviewMode) return;

    if (activeLabelId) {
      setGameState((prev) => {
        const newPlaced = { ...prev.placedPoints };
        Object.keys(newPlaced).forEach((tid) => {
          if (newPlaced[tid] === activeLabelId) delete newPlaced[tid];
        });
        newPlaced[pointId] = activeLabelId;
        return { ...prev, placedPoints: newPlaced };
      });
      setActiveLabelId(null);
    } else {
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
    setGameState((prev) => ({
      ...prev,
      placedPoints: {},
      isReviewMode: false,
      showCongratulation: false,
    }));
    setActiveLabelId(null);
  };

  // DnD Handlers
  const handleDragStart = (event: DragStartEvent) => {
    if (gameState.isReviewMode || gameState.interactionMode !== "drag") return;
    setActiveLabelId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveLabelId(null);
    const { over, active } = event;
    if (over && over.id) {
      const targetId = over.id as string;
      const labelId = active.id as string;

      setGameState((prev) => {
        const newPlaced = { ...prev.placedPoints };
        Object.keys(newPlaced).forEach((tid) => {
          if (newPlaced[tid] === labelId) delete newPlaced[tid];
        });
        newPlaced[targetId] = labelId;
        return { ...prev, placedPoints: newPlaced };
      });
    }
  };

  return (
    <div className="game-container">
      <GameHeader
        progress={Object.keys(gameState.placedPoints).length}
        total={APP_DATA.points.length}
        onHelp={() =>
          alert(
            gameState.interactionMode === "click"
              ? "Click a label, then click its target point. You can still zoom and pan!"
              : "Drag labels from the rack onto the target points.",
          )
        }
        onReset={resetGame}
      />

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <main className="game-main">
          <div className="canvas-area">
            <TransformWrapper
              ref={transformRef}
              initialScale={1}
              minScale={0.5}
              maxScale={4}
              centerOnInit
              doubleClick={{ disabled: true }}
              onTransformed={(ref) => setTransform({ ...ref.state })}
              onInit={(ref) => setTransform({ ...ref.state })}
              panning={{
                disabled:
                  gameState.interactionMode === "drag" && !!activeLabelId,
              }}
            >
              {({ zoomIn, zoomOut, resetTransform }) => (
                <div className="diagram-stage">
                  <div className="canvas-controls">
                    <button onClick={() => zoomIn()}>+</button>
                    <button onClick={() => zoomOut()}>-</button>
                    <button
                      className="btn-reset-view"
                      onClick={() => resetTransform()}
                    >
                      Reset View
                    </button>
                  </div>

                  <TransformComponent
                    wrapperStyle={{ width: "100%", height: "100%" }}
                  >
                    <div className="diagram-wrapper">
                      {APP_DATA.imagePath ? (
                        <img
                          ref={imgRef}
                          src={resolveAssetUrl(APP_DATA.imagePath)}
                          alt="Diagram"
                          className="diagram-image"
                          draggable={false}
                          onLoad={(e) => {
                            const img = e.currentTarget;
                            setImgSize({
                              width: img.offsetWidth,
                              height: img.offsetHeight,
                            });
                          }}
                        />
                      ) : (
                        <div className="image-placeholder">
                          <span className="placeholder-icon">🖼️</span>
                          <span>No Image Selected</span>
                        </div>
                      )}
                    </div>
                  </TransformComponent>

                  {/* SEPARATED ANNOTATION LAYER - Renders on top of TransformComponent */}
                  <div className="annotation-layer">
                    {imgSize &&
                      APP_DATA.points.map((point) => {
                        const placedLabelId = gameState.placedPoints[point.id];
                        const labelItem = APP_DATA.points.find(
                          (p) => p.id === placedLabelId,
                        );
                        const isCorrect =
                          gameState.isReviewMode && placedLabelId === point.id;
                        const isWrong = Boolean(
                          gameState.isReviewMode &&
                          placedLabelId &&
                          placedLabelId !== point.id,
                        );

                        // CALCULATE CONSTANT-SIZE POSITION
                        const x =
                          (point.xPercent / 100) *
                            imgSize.width *
                            transform.scale +
                          transform.positionX;
                        const y =
                          (point.yPercent / 100) *
                            imgSize.height *
                            transform.scale +
                          transform.positionY;

                        return (
                          <AnnotationPointWrapper
                            key={point.id}
                            point={point}
                            isCorrect={isCorrect}
                            isWrong={isWrong}
                            hasLabel={!!placedLabelId}
                            placedLabelText={labelItem?.text}
                            canDrop={!!activeLabelId}
                            onClick={() => handleTargetClick(point.id)}
                            interactionMode={gameState.interactionMode}
                            style={{
                              left: `${x}px`,
                              top: `${y}px`,
                              position: "absolute",
                            }}
                          />
                        );
                      })}
                  </div>
                </div>
              )}
            </TransformWrapper>
          </div>

          <aside className="labels-rack">
            <div className="rack-header">
              <h2 className="rack-title">Labels</h2>
              <div className="mode-toggle">
                <button
                  className={`mode-btn ${gameState.interactionMode === "click" ? "active" : ""}`}
                  onClick={() =>
                    setGameState((prev) => ({
                      ...prev,
                      interactionMode: "click",
                    }))
                  }
                >
                  Click
                </button>
                <button
                  className={`mode-btn ${gameState.interactionMode === "drag" ? "active" : ""}`}
                  onClick={() =>
                    setGameState((prev) => ({
                      ...prev,
                      interactionMode: "drag",
                    }))
                  }
                >
                  Drag
                </button>
              </div>
            </div>

            <div className="labels-scroll-container">
              <AnimatePresence mode="popLayout">
                {availableLabels.map((label) => (
                  <LabelItem
                    key={label.id}
                    label={label}
                    isActive={activeLabelId === label.id}
                    isPinned={
                      gameState.interactionMode === "click" &&
                      activeLabelId === label.id
                    }
                    disabled={gameState.isReviewMode}
                    onClick={() => {
                      if (gameState.interactionMode === "click") {
                        setActiveLabelId((prev) =>
                          prev === label.id ? null : label.id,
                        );
                      }
                    }}
                  />
                ))}
              </AnimatePresence>
              {availableLabels.length === 0 && (
                <div className="no-labels">All items placed!</div>
              )}
            </div>

            <div className="rack-footer">
              <button
                className={`btn-submit ${gameState.isReviewMode ? "active" : ""}`}
                onClick={checkResults}
                disabled={Object.keys(gameState.placedPoints).length === 0}
              >
                {gameState.isReviewMode ? "Continue" : "Check Results"}
              </button>
            </div>
          </aside>
        </main>
      </DndContext>

      <DragOverlay dropAnimation={null}>
        {activeLabelId && gameState.interactionMode === "drag" ? (
          <div className="drag-overlay-label">
            {APP_DATA.points.find((p) => p.id === activeLabelId)?.text}
          </div>
        ) : null}
      </DragOverlay>

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
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="popup-icon">🎉</div>
              <h2>Wonderful!</h2>
              <p>You have correctly labeled the entire diagram.</p>
              <button
                className="btn-popup"
                onClick={() =>
                  setGameState((prev) => ({
                    ...prev,
                    showCongratulation: false,
                  }))
                }
              >
                Keep Exploring
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Specialized Wrappers ---

import { useDraggable, useDroppable } from "@dnd-kit/core";

const AnnotationPointWrapper: React.FC<{
  point: LabelledDiagramPoint;
  isCorrect: boolean;
  isWrong: boolean;
  hasLabel: boolean;
  placedLabelText?: string;
  canDrop: boolean;
  onClick: () => void;
  interactionMode: "click" | "drag";
  style: React.CSSProperties;
}> = ({ point, interactionMode, style, canDrop, ...props }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: point.id,
    disabled: interactionMode !== "drag",
  });

  return (
    <div ref={setNodeRef} style={style}>
      <AnnotationPoint
        point={point}
        canDrop={canDrop || isOver}
        style={{}} // Style is applied to parent wrapper
        {...props}
      />
    </div>
  );
};

const LabelItem: React.FC<{
  label: LabelledDiagramPoint;
  isActive: boolean;
  isPinned: boolean;
  disabled: boolean;
  onClick: () => void;
}> = ({ label, isActive, isPinned, disabled, onClick }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: label.id,
    disabled: disabled,
  });

  return (
    <motion.div
      ref={setNodeRef}
      layout
      {...listeners}
      {...attributes}
      className={`label-item ${isActive ? "active" : ""} ${isPinned ? "pinned" : ""} ${isDragging ? "dragging" : ""}`}
      onClick={onClick}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
    >
      {label.text}
    </motion.div>
  );
};

export default DiagramGame;
