import { motion } from "framer-motion";
import { useId } from "react";

interface Props {
  liked: boolean;
  count: number;
  onClick: () => void;
  /** 화면 읽기용 이름. 기본 "추천". */
  label?: string;
  /** 켜면 숫자 대신 잔만 보인다. */
  hideCount?: boolean;
  /** 눌리는 영역을 넓히고 싶을 때 덧붙인다. */
  className?: string;
  disabled?: boolean;
  /** 눌림 상태를 화면 읽기에 알린다. 숫자를 숨긴 잔(hideCount)은 liked로 알린다. */
  pressed?: boolean;
  /** 처리 중에는 포커스를 잃지 않게 disabled 대신 이것으로 알린다. */
  busy?: boolean;
}

/**
 * 글렌캐런 잔 - 클릭 시 잔 밑바닥에서 위스키(호박색)가
 * 잔 높이의 30%까지 부드럽게 차오른다.
 */
export const GlencairnButton = ({ liked, count, onClick, label = "추천", hideCount = false, className = "", disabled = false, pressed, busy }: Props) => {
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
      disabled={disabled}
      className={`flex items-center gap-1.5 text-[#3e2616]/70 hover:text-[#a8201a] transition-colors ${className}`}
      aria-label={label}
      aria-pressed={pressed ?? (hideCount ? liked : undefined)}
      aria-disabled={busy || undefined}
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
      {!hideCount && <span className="text-xs font-serif">{count}</span>}
    </button>
  );
};
