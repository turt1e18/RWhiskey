import { motion } from "framer-motion";
import { LoungeNote } from "../_data/mockData";
import { LoungeNoteCard } from "./LoungeNoteCard";

interface Props {
  notes: LoungeNote[];
  scrappedIds: string[];
  onToggleScrap: (id: string) => void;
}

export const LoungeBoard = ({ notes, scrappedIds, onToggleScrap }: Props) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="bg-cork min-h-screen w-full pt-28 pb-10 px-6 overflow-hidden relative"
    >
      <div className="mx-auto max-w-6xl h-full flex flex-col">
        <header className="text-center mb-10">
          <div className="inline-block rounded-xl bg-black/35 backdrop-blur-sm px-8 py-4 shadow-lg">
            <p
              className="text-xs uppercase tracking-[0.4em] text-[#fdfbf7]/80"
              style={{ textShadow: "0 2px 6px rgba(0,0,0,0.6)" }}
            >
              The Lounge
            </p>
            <h1
              className="font-serif text-4xl text-[#fdfbf7] mt-2"
              style={{ textShadow: "0 2px 8px rgba(0,0,0,0.7)" }}
            >
              오늘의 추천 게시판
            </h1>
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hidden fade-bottom-cork pr-1 pb-12">
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 [column-fill:_balance]">
            {notes.map((n, i) => (
              <LoungeNoteCard
                key={n.id}
                note={n}
                index={i}
                isLiked={scrappedIds.includes(n.id)}
                onToggleScrap={onToggleScrap}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

