import { aiIdentifier } from "../services/bodyPartIdentifier";
import type { DiagramData } from "../types/diagram";

interface FeedbackProps {
  data: DiagramData;
  placed: Record<string, string>;
}

export const GameFeedback: React.FC<FeedbackProps> = ({ data, placed }) => {
  // Calculate accuracy
  const totalZones = data.zones.length;
  const correctPlacements = data.zones.filter(
    (zone) => placed[zone.id] === zone.correctLabelId
  ).length;

  const accuracy = totalZones > 0 ? correctPlacements / totalZones : 0;
  const percentage = Math.round(accuracy * 100);

  // Get completion message (do not show when there are no zones)
  const completionMessage =
    totalZones > 0
      ? correctPlacements === totalZones
        ? aiIdentifier.getCompletionMessage(1.0)
        : correctPlacements > 0
        ? aiIdentifier.getCompletionMessage(accuracy)
        : null
      : null;

  // Count placed and remaining
  const placedCount = Object.keys(placed).length;
  const remaining = data.labels.length - placedCount;

  const showProgressBar = placedCount > 0;

  return (
    <div className="fixed top-4 right-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-elevated p-5 max-w-xs z-40 border border-white/10 backdrop-blur-sm animate-slide-up">
      {/* Header */}
      <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
        <span className="text-xl">📊</span>
        Progress
      </h3>

      {/* Stats */}
      <div className="space-y-2 mb-4 bg-white/5 rounded-lg p-3 border border-white/10">
        <div className="flex justify-between text-sm">
          <span className="text-purple-200">Placed:</span>
          <span className="font-bold text-cyan-400">
            {placedCount} / {data.labels.length}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-purple-200">Correct:</span>
          <span className="font-bold text-emerald-400">
            {correctPlacements} / {totalZones}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      {showProgressBar && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-purple-300">
              Accuracy
            </span>
            <span className="text-sm font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              {percentage}%
            </span>
          </div>
          <div className="w-full bg-gradient-to-r from-slate-700 to-slate-600 rounded-full h-3 overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                accuracy === 1
                  ? "bg-gradient-to-r from-emerald-400 to-teal-400"
                  : accuracy >= 0.8
                  ? "bg-gradient-to-r from-cyan-400 to-blue-500"
                  : accuracy >= 0.5
                  ? "bg-gradient-to-r from-amber-400 to-orange-500"
                  : "bg-gradient-to-r from-red-400 to-pink-500"
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* AI Feedback */}
      {completionMessage && (
        <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-400/50 rounded-lg p-3 mb-3">
          <p className="text-sm text-purple-200">✨ {completionMessage}</p>
        </div>
      )}

      {/* Status Message */}
      <div className="text-xs text-purple-300 text-center">
        {data.labels.length === 0 ? (
          <p className="text-purple-400">No labels defined yet</p>
        ) : remaining > 0 ? (
          <p>
            <span className="font-bold text-purple-200">{remaining}</span> more to label
          </p>
        ) : (
          <p className="text-green-600 font-semibold">All labeled! ✓</p>
        )}
      </div>

      {/* Hint System
      {correctPlacements > 0 && remaining > 0 && remaining <= 3 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs font-semibold text-gray-700 mb-2">💡 Tips:</p>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Look at the shape and think about location</li>
            <li>• Read the zone name carefully</li>
            <li>• Hover for feedback on incorrect placements</li>
          </ul>
        </div>
      )} */}
    </div>
  );
};

export default GameFeedback;
