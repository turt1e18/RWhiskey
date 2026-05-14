import { motion } from "framer-motion";

interface TopNavProps {
  view: "notes" | "lounge" | "scrapbook";
  onChange: (v: "notes" | "lounge") => void;
}

const tabs: { key: "notes" | "lounge"; label: string }[] = [
  { key: "notes", label: "테이스팅 노트" },
  { key: "lounge", label: "라운지" },
];

export const TopNav = ({ view, onChange }: TopNavProps) => {
  return (
    <nav className="fixed top-6 right-6 z-50">
      <div className="flex items-center gap-1 rounded-full border border-[#c9a14a]/40 bg-[#3e240c]/80 px-2 py-1.5 backdrop-blur-sm shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
        {tabs.map((t) => {
          const active = view === t.key;
          return (
            <button
              key={t.key}
              onClick={() => onChange(t.key)}
              className="relative px-5 py-2 text-sm font-serif tracking-wider"
            >
              {active && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-full bg-[#c9a14a]"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span
                className={`relative z-10 ${
                  active ? "text-[#3e240c]" : "text-[#fdfbf7]/70 hover:text-[#fdfbf7]"
                }`}
              >
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
