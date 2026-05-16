import { motion } from "framer-motion";
import { LoungeNote } from "../_data/mockData";
import { GlencairnButton } from "./GlencairnButton";

interface LoungeNoteCardProps {
  note: LoungeNote;
  isLiked: boolean;
  index: number;
  onToggleScrap: (id: string) => void;
}

const Pin = ({ color }: { color: string }) => (
  <svg width="22" height="22" viewBox="0 0 22 22" className="drop-shadow-md">
    <defs>
      <radialGradient id={`g-${color.replace("#", "")}`} cx="35%" cy="35%">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.7" />
        <stop offset="40%" stopColor={color} />
        <stop offset="100%" stopColor="#000" stopOpacity="0.4" />
      </radialGradient>
    </defs>
    <circle cx="11" cy="11" r="8" fill={`url(#g-${color.replace("#", "")})`} stroke="rgba(0,0,0,0.4)" strokeWidth="0.5" />
    <circle cx="8.5" cy="8.5" r="2" fill="#fff" fillOpacity="0.6" />
  </svg>
);

export const LoungeNoteCard = ({ note, isLiked, index, onToggleScrap }: LoungeNoteCardProps) => {
  const displayName = note.whiskyName || (note as any).whiskeyName || (note as any).drinkName || (note as any).nameKo || note.cocktailName || "Unknown Item";

  return (
    <motion.div
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, type: "spring", stiffness: 120, damping: 14 }}
      className="relative mb-6 break-inside-avoid"
    >
      <div className="absolute left-1/2 -top-2 -translate-x-1/2 z-20">
        <Pin color={note.pinColor} />
      </div>
      <div className="note-paper p-6 pt-8 text-[#1a1a1a]">
        <p className="text-lg md:text-xl uppercase tracking-tight font-bold border-b border-[#1a1a1a]/10 pb-2 mb-3 font-kyobo">
          <span>{displayName}</span> <span className="mx-1 text-[#1a1a1a]/40 font-normal">-</span> <span className="text-sm md:text-base text-[#1a1a1a] font-medium">{note.author}</span>
        </p>
        
        {note.formType === "basic" ? (
          <div className="mt-3 space-y-2 text-[#1a1a1a] text-base md:text-lg leading-relaxed font-kyobo">
            {note.nose && (
              <p>
                <span className="text-[#c9a14a] font-bold mr-1">[향]</span>
                <span>{note.nose}</span>
              </p>
            )}
            {note.palate && (
              <p>
                <span className="text-[#c9a14a] font-bold mr-1">[맛]</span>
                <span>{note.palate}</span>
              </p>
            )}
            {note.finish && (
              <p>
                <span className="text-[#c9a14a] font-bold mr-1">[여운]</span>
                <span>{note.finish}</span>
              </p>
            )}
          </div>
        ) : (
          <p className="mt-3 text-[#1a1a1a] text-base md:text-lg leading-relaxed font-kyobo">
            <span>{note.memo}</span>
          </p>
        )}
        
        <div className="mt-5 flex items-center justify-between border-t border-dotted border-[#3e2616]/30 pt-3">
          <span className="text-[10px] text-[#3e2616]/50 font-serif">RECOMMEND</span>
          <GlencairnButton
            liked={isLiked}
            count={note.likes + (isLiked ? 1 : 0)}
            onClick={() => onToggleScrap(note.id)}
          />
        </div>
      </div>
    </motion.div>
  );
};
