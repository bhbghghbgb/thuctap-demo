import { useState, useRef } from "react";
import DropZone from "./DropZone";
import BodyPartConnectors from "./BodyPartConnectors";
import type { DiagramData, Label } from "../types/diagram";

interface Props {
  data: DiagramData;
  placed: Record<string, string>;
}

const DiagramBoard = ({ data, placed }: Props) => {
  const [imageError, setImageError] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const [boardDimensions, setBoardDimensions] = useState({ width: 500, height: 600 });

  const getLabel = (id: string): Label | undefined =>
    data.labels.find((l: Label) => l.id === id);

  // Create labels map for connectors
  const labelsMap = new Map(data.labels.map((l) => [l.id, l]));

  const handleImageLoad = () => {
    if (boardRef.current) {
      setBoardDimensions({
        width: boardRef.current.offsetWidth,
        height: boardRef.current.offsetHeight,
      });
    }
  };

  return (
    <div className="relative flex-1">
      <div
        ref={boardRef}
        className="relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-xl p-4 inline-block"
      >
        {imageError ? (
          <div className="min-w-[300px] min-h-[400px] bg-gray-200 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-400">
            <div className="text-center">
              <p className="text-gray-600 font-semibold">📸 Image not found</p>
              <p className="text-sm text-gray-500 mt-2">Expected location:</p>
              <p className="text-xs text-gray-600 font-mono break-all">{data.imagePath}</p>
              <p className="text-xs text-gray-500 mt-3">
                Upload your Akari image to get started!
              </p>
            </div>
          </div>
        ) : (
          <img
            src={data.imagePath}
            alt={data.name}
            className="w-[500px] rounded-xl shadow-lg"
            onError={() => setImageError(true)}
            onLoad={handleImageLoad}
            loading="lazy"
          />
        )}

        {/* Drop zones */}
        {data.zones.map((zone) => {
          const labelId = placed[zone.id];
          const label = labelId ? getLabel(labelId) : undefined;

          return (
            <DropZone
              key={zone.id}
              zone={zone}
              label={label}
              isCorrect={
                labelId ? labelId === zone.correctLabelId : undefined
              }
              correctLabelId={zone.correctLabelId}
            />
          );
        })}

        {/* Visual connectors */}
        <BodyPartConnectors
          zones={data.zones}
          placed={placed}
          labelsMap={labelsMap}
          containerWidth={boardDimensions.width}
          containerHeight={boardDimensions.height}
        />
      </div>
    </div>
  );
};

export default DiagramBoard;