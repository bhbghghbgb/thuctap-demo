import React, { useState, useRef, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useAnimation,
  type PanInfo,
} from "framer-motion";
import clsx from "clsx";

// --- Định nghĩa kiểu dữ liệu ---
interface Item {
  id: string;
  name: string;
  svg: string;
  groupId: string;
}

interface Group {
  id: string;
  name: string;
  svg: string;
}

// --- Dữ liệu mẫu ---
const MY_APP_DATA: { groups: Group[]; items: Item[] } =
  import.meta.env.PROD && window.MY_APP_DATA
    ? window.MY_APP_DATA
    : {
        groups: [
          { id: "group1", name: "Trái cây", svg: "/svg/basket.svg" },
          { id: "group2", name: "Rau củ", svg: "/svg/box.svg" },
          { id: "group3", name: "Đồ dùng", svg: "/svg/backpack.svg" },
        ],
        items: [
          {
            id: "item1",
            name: "Táo",
            svg: "/svg/apple.svg",
            groupId: "group1",
          },
          {
            id: "item2",
            name: "Chuối",
            svg: "/svg/banana.svg",
            groupId: "group1",
          },
          {
            id: "item3",
            name: "Cà rốt",
            svg: "/svg/carrot.svg",
            groupId: "group2",
          },
          {
            id: "item4",
            name: "Khoai tây",
            svg: "/svg/potato.svg",
            groupId: "group2",
          },
          {
            id: "item5",
            name: "Sách",
            svg: "/svg/book.svg",
            groupId: "group3",
          },
          { id: "item6", name: "Bút", svg: "/svg/pen.svg", groupId: "group3" },
          {
            id: "item7",
            name: "Cam",
            svg: "/svg/orange.svg",
            groupId: "group1",
          },
          {
            id: "item8",
            name: "Dâu",
            svg: "/svg/strawberry.svg",
            groupId: "group1",
          },
        ],
      };

const initialItems: Item[] = MY_APP_DATA.items;

const groups: Group[] = MY_APP_DATA.groups;

const layoutTransition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
};

// --- Component Item có thể kéo ---
interface DraggableItemProps {
  item: Item;
  onDragEnd: (
    item: Item,
    info: PanInfo,
    ref: React.RefObject<HTMLDivElement>,
  ) => Promise<boolean>;
  containerRef: React.RefObject<HTMLDivElement>;
  isDragging: boolean;
  onDragStart: (itemId: string) => void;
}

const DraggableItem: React.FC<DraggableItemProps> = ({
  item,
  onDragEnd,
  isDragging,
  onDragStart,
}) => {
  const controls = useAnimation();
  const itemRef = useRef<HTMLDivElement>(null);

  const handleDragStart = () => {
    onDragStart(item.id);
  };

  const handleDragEnd = async (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const droppedOnGroup = await onDragEnd(item, info, itemRef);

    if (!droppedOnGroup) {
      controls.start({
        x: 0,
        y: 0,
        transition: { ...layoutTransition, duration: 0.3 },
      });
    }
  };

  return (
    <motion.div
      ref={itemRef}
      layout
      layoutId={item.id}
      drag
      dragMomentum={false}
      dragElastic={0.1}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      animate={controls}
      whileDrag={{
        scale: 1.1,
        zIndex: 50,
        boxShadow: "0px 10px 20px rgba(0,0,0,0.2)",
        cursor: "grabbing",
      }}
      transition={layoutTransition}
      className={clsx(
        "w-20 h-20 flex items-center justify-center border-4 border-yellow-400 rounded-3xl bg-white shadow-lg select-none",
        isDragging
          ? "opacity-0"
          : "opacity-100 cursor-grab active:cursor-grabbing",
      )}
      style={{ touchAction: "none" }}
    >
      <img
        src={item.svg}
        alt={item.name}
        className="w-12 h-12 object-contain pointer-events-none"
      />
    </motion.div>
  );
};

// --- Component Cột Group ---
interface GroupColumnProps {
  group: Group;
  items: Item[];
}

const GroupColumn: React.FC<GroupColumnProps> = ({ group, items }) => {
  return (
    <div
      data-group-id={group.id}
      className="flex-shrink-0 w-64 h-full flex flex-col items-center bg-blue-50 rounded-t-3xl border-l-4 border-r-4 border-t-4 border-blue-200"
    >
      <div className="flex flex-col items-center p-4 border-b-4 border-blue-200 w-full bg-blue-100 rounded-t-3xl">
        <div className="w-20 h-20 flex items-center justify-center">
          <img
            src={group.svg}
            alt={group.name}
            className="w-16 h-16 object-contain"
          />
        </div>
        <h3 className="mt-2 text-xl font-bold text-blue-800 text-center">
          {group.name}
        </h3>
      </div>

      <div className="flex-1 w-full p-4 overflow-y-auto custom-scrollbar flex flex-col items-center gap-4">
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              layoutId={item.id}
              layout
              transition={layoutTransition}
              className="w-16 h-16 flex items-center justify-center border-4 border-green-400 bg-white rounded-2xl shadow"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <img
                src={item.svg}
                alt={item.name}
                className="w-10 h-10 object-contain"
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
const MatchingGameDemo: React.FC = () => {
  const [unansweredItems, setUnansweredItems] = useState<Item[]>(initialItems);
  const [groupedItems, setGroupedItems] = useState<Record<string, Item[]>>({});
  const [feedback, setFeedback] = useState<{
    type: "correct" | "incorrect";
    message: string;
  } | null>(null);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);

  const sceneRef = useRef<HTMLDivElement>(null);
  const leftContainerRef = useRef<HTMLDivElement>(null);

  // Khởi tạo groupedItems
  useEffect(() => {
    const initialGrouped: Record<string, Item[]> = {};
    groups.forEach((g) => (initialGrouped[g.id] = []));
    setGroupedItems(initialGrouped);
  }, []);

  const showFeedback = (type: "correct" | "incorrect", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 1500);
  };

  const handleDragStart = (itemId: string) => {
    setDraggingItemId(itemId);
  };

  // Xử lý khi kết thúc kéo
  const handleDragEnd = async (
    item: Item,
    info: PanInfo,
    itemRef: React.RefObject<HTMLDivElement>,
  ): Promise<boolean> => {
    setDraggingItemId(null);

    // Xác định group được thả vào
    const droppedPoint = info.point;
    let matchedGroupId: string | null = null;

    const groupElements =
      sceneRef.current?.querySelectorAll<HTMLDivElement>("[data-group-id]");
    groupElements?.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (
        droppedPoint.x >= rect.left &&
        droppedPoint.x <= rect.right &&
        droppedPoint.y >= rect.top &&
        droppedPoint.y <= rect.bottom
      ) {
        matchedGroupId = el.dataset.groupId || null;
      }
    });

    if (!matchedGroupId) return false;

    // Kiểm tra đúng/sai
    if (item.groupId === matchedGroupId) {
      setUnansweredItems((prev) => prev.filter((i) => i.id !== item.id));
      setGroupedItems((prev) => ({
        ...prev,
        [matchedGroupId]: [...prev[matchedGroupId], item],
      }));
      showFeedback("correct", "Chính xác! 🎉");
      return true;
    } else {
      showFeedback("incorrect", "Thử lại nhé! 🤔");
      return false;
    }
  };

  return (
    <div
      className="w-screen h-screen overflow-hidden bg-sky-100 p-6 flex flex-col font-sans relative"
      style={{
        backgroundImage: "radial-gradient(#bbf7d0 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }}
    >
      <header className="h-16 flex items-center justify-center mb-6 flex-shrink-0">
        <h1 className="text-4xl font-extrabold text-blue-900 tracking-tight shadow-text">
          Ghép Đôi Vui Vẻ
        </h1>
      </header>

      <div className="flex-1 flex gap-8 overflow-hidden min-h-0">
        {/* Bên trái: grid 2 cột, scroll dọc */}
        <div
          ref={leftContainerRef}
          // className="w-1/3 h-full bg-white/80 backdrop-blur-sm rounded-3xl p-6 border-4 border-yellow-300 shadow-inner overflow-y-auto"
          className="w-1/3 h-full bg-white/80 backdrop-blur-sm rounded-3xl p-6 border-4 border-yellow-300 shadow-inner"
        >
          <div className="grid grid-cols-2 gap-4 content-start relative">
            <AnimatePresence mode="popLayout">
              {unansweredItems.map((item) => (
                <DraggableItem
                  key={item.id}
                  item={item}
                  onDragEnd={handleDragEnd}
                  isDragging={draggingItemId === item.id}
                  onDragStart={handleDragStart}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Bên phải: scroll ngang */}
        <div className="flex-1 h-full flex gap-6 overflow-x-auto pb-4 custom-scrollbar-h">
          {groups.map((group) => (
            <GroupColumn
              key={group.id}
              group={group}
              items={groupedItems[group.id] || []}
            />
          ))}
        </div>
      </div>

      {/* Thông báo */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.5 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className={clsx(
              "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50",
              "px-10 py-6 rounded-full text-white text-3xl font-bold shadow-2xl",
              feedback.type === "correct" ? "bg-green-500" : "bg-red-500",
            )}
          >
            {feedback.message}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #eff6ff; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #bfdbfe; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #60a5fa; }

        .custom-scrollbar-h::-webkit-scrollbar { height: 10px; }
        .custom-scrollbar-h::-webkit-scrollbar-track { background: #f0f9ff; border-radius: 5px; }
        .custom-scrollbar-h::-webkit-scrollbar-thumb { background: #bae6fd; border-radius: 5px; }
        .custom-scrollbar-h::-webkit-scrollbar-thumb:hover { background: #38bdf8; }

        .shadow-text { text-shadow: 2px 2px 0px rgba(255,255,255,0.8); }
      `}</style>
    </div>
  );
};

export default MatchingGameDemo;
