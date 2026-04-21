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
        Progress: {progress} / {total}
      </div>
    </div>
    <div className="header-controls">
      <button className="btn-header help" onClick={onHelp}>
        <span>💡</span> Tutorial
      </button>
      <button className="btn-header reset" onClick={onReset}>
        <span>🔄</span> Reset
      </button>
    </div>
  </header>
);

const TutorialModal: React.FC<{
  step: number;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}> = ({ step, onPrev, onNext, onClose }) => {
  const steps = [
    {
      title: "Welcome! 👋",
      desc: "Let's learn how to label this diagram correctly. It's easy, follow the steps!",
      img: "tutorial-1.png",
    },
    {
      title: "Move and Zoom 🔍",
      desc: "Use your mouse wheel to zoom in or out. Hold the LEFT button and drag to move the map around.",
      img: "tutorial-2.png",
    },
    {
      title: "Interactive Modes 🖱️",
      desc: "Click the icon in the sidebar to switch between 'Click' and 'Drag' modes.",
      img: "tutorial-3.png",
    },
    {
      title: "Labelling 🏷️",
      desc: "In Drag mode, pull a label onto a target circle. In Click mode, select a label first, then click a target.",
      img: "tutorial-4.png",
    },
    {
      title: "Check Results ✅",
      desc: "Press 'Check Results' at the bottom when you're done. Green means correct, Red means try again!",
      img: "tutorial-5.png",
    },
  ];

  const currentStep = steps[step];

  return (
    <div className="tutorial-overlay" onClick={onClose}>
      <motion.div
        className="tutorial-content"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="tutorial-media">
          <img
            src={`assets/images/${currentStep.img}`}
            alt={currentStep.title}
            className="tutorial-img"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              const parent = e.currentTarget.parentElement;
              if (parent) {
                const existingPlaceholder = parent.querySelector(
                  ".tutorial-placeholder",
                );
                if (!existingPlaceholder) {
                  const placeholder = document.createElement("div");
                  placeholder.className = "tutorial-placeholder";
                  placeholder.innerHTML = `<span>🖼️</span><span>Tutorial Image ${step + 1}</span>`;
                  parent.appendChild(placeholder);
                }
              }
            }}
          />
        </div>
        <div className="tutorial-info">
          <div className="tutorial-step-dots">
            {steps.map((_, i) => (
              <div key={i} className={`dot ${i === step ? "active" : ""}`} />
            ))}
          </div>
          <h2 className="tutorial-title">{currentStep.title}</h2>
          <p className="tutorial-desc">{currentStep.desc}</p>
          <div className="tutorial-nav">
            {step > 0 ? (
              <button className="btn-nav btn-prev" onClick={onPrev}>
                Previous
              </button>
            ) : (
              <div style={{ flex: 1 }} />
            )}
            {step < steps.length - 1 ? (
              <button className="btn-nav btn-next" onClick={onNext}>
                Next
              </button>
            ) : (
              <button className="btn-nav btn-done" onClick={onClose}>
                Start Playing
              </button>
            )}
          </div>
        </div>
      </motion.div>
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
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {label.text}
    </motion.div>
  );
};

const AnnotationPoint: React.FC<{
  point: LabelledDiagramPoint;
  isCorrect: boolean;
  isWrong: boolean;
  hasLabel: boolean;
  placedLabelText?: string;
  canDrop: boolean;
  onClick: () => void;
  style: React.CSSProperties;
}> = ({
  isCorrect,
  isWrong,
  hasLabel,
  placedLabelText,
  canDrop,
  onClick,
  style,
}) => (
  <div
    className={`target-point ${canDrop ? "can-drop" : ""} ${hasLabel ? "has-label" : ""} ${isCorrect ? "correct" : ""} ${isWrong ? "wrong" : ""}`}
    style={{ ...style, pointerEvents: "auto" }}
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

// --- Main Game Component ---

const DiagramGame: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    placedPoints: {},
    isReviewMode: false,
    showCongratulation: false,
    interactionMode: "click",
    isTutorialOpen: false,
    tutorialStep: 0,
  });

  const [activeLabelId, setActiveLabelId] = useState<string | null>(null);
  const [imgSize, setImgSize] = useState<{
    width: number;
    height: number;
  } | null>(APP_DATA.imagePath ? null : { width: 800, height: 500 });
  const [transform, setTransform] = useState({
    scale: 1,
    positionX: 0,
    positionY: 0,
  });

  // Debug log to help identify why the layer might be empty
  console.log("DiagramGame Render:", {
    hasImage: !!APP_DATA.imagePath,
    pointsCount: APP_DATA.points.length,
    imgSizeReady: !!imgSize,
    transform,
  });

  const transformRef = useRef<ReactZoomPanPinchRef>(null);
  const imgRef = useRef<HTMLImageElement>(null);

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
          setGameState((prev) => ({
            ...prev,
            isTutorialOpen: true,
            tutorialStep: 0,
          }))
        }
        onReset={() =>
          setGameState((prev) => ({
            ...prev,
            placedPoints: {},
            isReviewMode: false,
            showCongratulation: false,
          }))
        }
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
              minScale={0.1}
              maxScale={8}
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
                            console.log("Image Loaded Callback:", {
                              w: img.offsetWidth,
                              h: img.offsetHeight,
                            });
                            setImgSize({
                              width: img.offsetWidth,
                              height: img.offsetHeight,
                            });
                            if (transformRef.current) {
                              setTransform({
                                ...transformRef.current.instance.transformState,
                              });
                            }
                          }}
                        />
                      ) : (
                        <div className="image-placeholder">
                          <span className="placeholder-icon">🖼️</span>
                          <span className="placeholder-text">
                            Select a diagram in the editor to begin
                          </span>
                        </div>
                      )}
                    </div>
                  </TransformComponent>

                  <div className="annotation-layer">
                    {imgSize &&
                      APP_DATA.points.map((point) => {
                        const placedLabelId = gameState.placedPoints[point.id];
                        const labelItem = APP_DATA.points.find(
                          (p) => p.id === placedLabelId,
                        );
                        const isCorrect =
                          gameState.isReviewMode && placedLabelId === point.id;
                        const isWrong =
                          gameState.isReviewMode &&
                          placedLabelId &&
                          placedLabelId !== point.id;

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
                            id={point.id}
                            point={point}
                            isCorrect={isCorrect}
                            isWrong={isWrong}
                            hasLabel={!!placedLabelId}
                            placedLabelText={labelItem?.text}
                            canDrop={!!activeLabelId}
                            onClick={() => handleTargetClick(point.id)}
                            interactionMode={gameState.interactionMode}
                            style={{ left: x, top: y, position: "absolute" }}
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
              <button
                className="mode-toggle-icon"
                onClick={() =>
                  setGameState((prev) => ({
                    ...prev,
                    interactionMode:
                      prev.interactionMode === "click" ? "drag" : "click",
                  }))
                }
                title={`Switch to ${gameState.interactionMode === "click" ? "Drag" : "Click"} Mode`}
              >
                {gameState.interactionMode === "click" ? "🖱️" : "🖐️"}
              </button>
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
                <div className="no-labels">Challenge complete! 🎉</div>
              )}
            </div>

            <div className="rack-footer">
              <button
                className={`btn-submit ${gameState.isReviewMode ? "active" : ""}`}
                onClick={() => {
                  if (gameState.isReviewMode) {
                    setGameState((prev) => ({ ...prev, isReviewMode: false }));
                  } else {
                    const correctCount = Object.keys(
                      gameState.placedPoints,
                    ).filter(
                      (tid) => gameState.placedPoints[tid] === tid,
                    ).length;
                    setGameState((prev) => ({
                      ...prev,
                      isReviewMode: true,
                      showCongratulation:
                        correctCount === APP_DATA.points.length,
                    }));
                  }
                }}
                disabled={Object.keys(gameState.placedPoints).length === 0}
              >
                {gameState.isReviewMode ? "Back to Edit" : "Check Results"}
              </button>
            </div>
          </aside>
        </main>
      </DndContext>

      <DragOverlay
        dropAnimation={{
          duration: 300,
          easing: "cubic-bezier(0.18, 0.89, 0.32, 1.28)",
        }}
      >
        {activeLabelId && gameState.interactionMode === "drag" ? (
          <div className="drag-overlay-label">
            {APP_DATA.points.find((p) => p.id === activeLabelId)?.text}
          </div>
        ) : null}
      </DragOverlay>

      <AnimatePresence>
        {gameState.isTutorialOpen && (
          <TutorialModal
            step={gameState.tutorialStep}
            onPrev={() =>
              setGameState((prev) => ({
                ...prev,
                tutorialStep: prev.tutorialStep - 1,
              }))
            }
            onNext={() =>
              setGameState((prev) => ({
                ...prev,
                tutorialStep: prev.tutorialStep + 1,
              }))
            }
            onClose={() =>
              setGameState((prev) => ({ ...prev, isTutorialOpen: false }))
            }
          />
        )}

        {gameState.showCongratulation && (
          <div
            className="popup-overlay"
            onClick={() =>
              setGameState((p) => ({ ...p, showCongratulation: false }))
            }
          >
            <motion.div
              className="popup-content"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="popup-icon">🏆</div>
              <h2>Perfect Score!</h2>
              <p>You have successfully labelled all parts of the diagram.</p>
              <button
                className="btn-popup"
                onClick={() =>
                  setGameState((p) => ({ ...p, showCongratulation: false }))
                }
              >
                Awesome!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Specialized Wrappers ---

import { useDraggable, useDroppable } from "@dnd-kit/core";

const AnnotationPointWrapper: React.FC<{
  id: string;
  point: LabelledDiagramPoint;
  isCorrect: boolean;
  isWrong: boolean;
  hasLabel: boolean;
  placedLabelText?: string;
  canDrop: boolean;
  onClick: () => void;
  interactionMode: "click" | "drag";
  style: React.CSSProperties;
}> = ({ id, interactionMode, style, canDrop, ...props }) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    disabled: interactionMode !== "drag",
  });
  return (
    <div ref={setNodeRef} style={style}>
      <AnnotationPoint
        point={props.point}
        canDrop={canDrop || isOver}
        style={{}}
        {...props}
      />
    </div>
  );
};

export default DiagramGame;
