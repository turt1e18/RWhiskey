import { motion } from "framer-motion";
import { useId } from "react";

interface Props {
  liked: boolean;
  count: number;
  onClick: () => void;
}

/**
 * 글렌캐런 잔 - 클릭 시 잔 밑바닥에서 위스키(호박색)가
 * 잔 높이의 30%까지 부드럽게 차오른다.
 */
export const GlencairnButton = ({ liked, count, onClick }: Props) => {
  const uid = useId().replace(/:/g, "");
  const clipId = `glen-clip-${uid}`;

  // 잔 내부 좌표: y=2(상단) ~ y=23(바닥). 30% 채움 → 바닥에서 30% 높이까지.
  const innerTop = 2;
  const innerBottom = 23;
  const innerH = innerBottom - innerTop; // 21
  const filledTop = innerBottom - innerH * 0.3; // 30% 차오른 표면 y

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-[#3e2616]/70 hover:text-[#a8201a] transition-colors"
      aria-label="추천"
    >
      <motion.span
        animate={liked ? { scale: [1, 1.25, 1] } : { scale: 1 }}
        transition={{ duration: 0.35 }}
        className="inline-block"
      >
        <svg width="22" height="28" viewBox="0 0 22 28" fill="none">
          <defs>
            <clipPath id={clipId}>
              {/* 잔 내부 (외곽선과 동일 path) */}
              <path d="M5 2 L17 2 L16 9 C16 9 19 11 19 15 C19 20 15 23 11 23 C7 23 3 20 3 15 C3 11 6 9 6 9 Z" />
            </clipPath>
          </defs>

          {/* 위스키 액체 (밑바닥에서 위로 차오름) */}
          <g clipPath={`url(#${clipId})`}>
            <motion.rect
              x="0"
              width="22"
              fill="#c67b27"
              initial={false}
              animate={{
                y: liked ? filledTop : innerBottom,
                height: liked ? innerBottom - filledTop + 1 : 0,
              }}
              transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
            />
            {/* 액체 표면 하이라이트 */}
            <motion.rect
              x="0"
              width="22"
              height="0.7"
              fill="#e8a45a"
              initial={false}
              animate={{ y: liked ? filledTop : innerBottom, opacity: liked ? 0.9 : 0 }}
              transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
            />
          </g>

          {/* 글렌캐런 외곽선 */}
          <path
            d="M5 2 L17 2 L16 9 C16 9 19 11 19 15 C19 20 15 23 11 23 C7 23 3 20 3 15 C3 11 6 9 6 9 Z"
            stroke="currentColor"
            strokeWidth="1.4"
            fill="none"
          />
          {/* 받침 */}
          <line x1="11" y1="23" x2="11" y2="26" stroke="currentColor" strokeWidth="1.4" />
          <line x1="6" y1="26" x2="16" y2="26" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </motion.span>
      <span className="text-xs font-serif">{count}</span>
    </button>
  );
};
