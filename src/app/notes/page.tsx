"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { AnimatePresence, motion } from "framer-motion";
import { ScrapbookView } from "./_components/ScrapbookView";
import { DiaryFrame } from "./_components/DiaryFrame";
import { PersonalListView } from "./_components/PersonalListView";
import { ReviewView } from "./_components/ReviewView";
import { Bookmark } from "./_components/Bookmark";
import { MemoCard } from "./_components/MemoCard";
import { HelpGuide } from "./_components/HelpGuide";
import { TopNav } from "./_components/TopNav";
import { LoungeBoard } from "./_components/LoungeBoard";
import { initialWhiskies, loungeNotes, WhiskyEntry, LoungeNote } from "./_data/mockData";
import { toast } from "sonner";
import { notesApi } from "@/api/whiskeyApi";
import { NoteResponse, NoteReviewRequest } from "@/type/ApiInterface";
import "./notes.css";

type View = "notes" | "lounge" | "scrapbook";
type NoteMode = "list" | "review";

export default function MyNotesPage() {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const router = useRouter();

  const [view, setView] = useState<View>("notes");
  const [mode, setMode] = useState<NoteMode>("list");
  const [whiskies, setWhiskies] = useState<WhiskyEntry[]>([]);
  const [loungeNotesData, setLoungeNotesData] = useState<LoungeNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<WhiskyEntry | null>(null);

  // 스크랩된 라운지 노트 ID 관리
  const [scrappedIds, setScrappedIds] = useState<string[]>([]);
  const scrappedNotes = loungeNotesData.filter((n) => scrappedIds.includes(n.id));

  // API 응답을 UI 모델로 매핑 (개인 노트)
  const mapNoteResponseToEntry = useCallback((note: NoteResponse): WhiskyEntry => {
    return {
      id: String(note.id),
      oid: note.oid,
      status: note.status as "평가완료" | "미평가",
      category: "whisky", 
      formType: note.reviewType === "BASIC" ? "basic" : "free",
      whiskyName: note.whiskeyName,
      whiskyNameEn: note.whiskeyNameEn,
      date: note.recommendedAt ? note.recommendedAt.slice(0, 10).replace(/-/g, ".") : "",
      weatherValue: note.weatherValue,
      moodValue: note.moodValue,
      abvValue: note.abvValue,
      additionalValue: note.additionalValue,
      classification: note.whiskeyCategory,
      featureTags: note.featureTags,
      foodName: note.foodName,
      pairingNote: note.pairingNote,
      bartenderWord: note.bartenderWord,
      rating: note.rating,
      nose: note.nose,
      palate: note.palate,
      finish: note.finish,
      memo: note.memo,
      shared: note.shared,
      ratedAt: note.ratedAt ? note.ratedAt.slice(0, 10).replace(/-/g, ".") : undefined,
      isScrapped: note.isScrapped,
      ownerNickname: note.ownerNickname
    };
  }, []);

  // API 응답을 UI 모델로 매핑 (라운지 노트)
  const mapNoteResponseToLounge = useCallback((note: NoteResponse, index: number): LoungeNote => {
    const pinColors = ["#c0392b", "#27496d", "#7d3c98", "#1f618d", "#2e4053"];
    return {
      id: String(note.id),
      author: note.ownerNickname || "익명",
      category: "whisky",
      formType: note.reviewType === "BASIC" ? "basic" : "free",
      whiskyName: note.whiskeyName,
      whiskyNameEn: note.whiskeyNameEn,
      likes: 0, // 백엔드 likes 필드 부재로 0 초기화
      rotate: (index % 10) - 5, // 아날로그 느낌을 위한 약간의 회전
      pinColor: pinColors[index % pinColors.length],
      nose: note.nose,
      palate: note.palate,
      finish: note.finish,
      memo: note.memo,
      rating: note.rating,
      createdAt: note.ratedAt ? note.ratedAt.slice(0, 10).replace(/-/g, ".") : "",
      pairing: note.foodName
    };
  }, []);

  const fetchMyNotes = useCallback(async () => {
    try {
      const data = await notesApi.getMyNotes();
      setWhiskies(data.map(mapNoteResponseToEntry));
    } catch (error) {
      console.error("Failed to fetch notes:", error);
      toast.error("노트를 불러오는데 실패했습니다.");
    }
  }, [mapNoteResponseToEntry]);

  const fetchLoungeFeed = useCallback(async () => {
    try {
      const data = await notesApi.getLoungeFeed();
      setLoungeNotesData(data.map((n, i) => mapNoteResponseToLounge(n, i)));
    } catch (error) {
      console.error("Failed to fetch lounge feed:", error);
    }
  }, [mapNoteResponseToLounge]);

  const fetchScraps = useCallback(async () => {
    try {
      const data = await notesApi.getScrappedNotes();
      setScrappedIds(data.map(n => String(n.id)));
    } catch (error) {
      console.error("Failed to fetch scraps:", error);
    }
  }, []);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchMyNotes(), fetchLoungeFeed(), fetchScraps()]);
    setLoading(false);
  }, [fetchMyNotes, fetchLoungeFeed, fetchScraps]);

  useEffect(() => {
    if (isInitialized) {
      if (!isAuthenticated) {
        router.push("/login");
      } else {
        loadAllData();
      }
    }
  }, [isAuthenticated, isInitialized, router, loadAllData]);

  const toggleScrap = async (id: string) => {
    try {
      const res = await notesApi.toggleScrap(Number(id));
      if (res.isScrapped) {
        setScrappedIds(prev => [...prev, id]);
        toast.success("스크랩북에 저장되었습니다 🥃");
      } else {
        setScrappedIds(prev => prev.filter(i => i !== id));
        toast.info("스크랩이 취소되었습니다.");
      }
    } catch (error) {
      console.error("Scrap toggle failed:", error);
      toast.error("요청에 실패했습니다.");
    }
  };

  if (!isInitialized || !isAuthenticated) {
    return null;
  }

  const handleSelect = (w: WhiskyEntry) => {
    setSelected(w);
    setMode("review");
  };

  const handleBack = () => {
    setMode("list");
    setSelected(null);
  };

  const handleSubmit = async ({
    flow,
    payload
  }: {
    flow: "A" | "B";
    payload: Partial<WhiskyEntry>;
  }) => {
    if (!selected) return;

    try {
      // 1. 서버에 리뷰 업데이트 요청 (API Contract 5.5 규격 준수)
      const reviewRequest: NoteReviewRequest = {
        reviewType: payload.formType === "basic" ? "BASIC" : "FREE",
        rating: payload.rating,
        shared: flow === "A", // Flow A(익명제출)면 true, Flow B(개인보관)면 false
        ...(payload.formType === "basic"
          ? {
              nose: payload.nose || "",
              palate: payload.palate || "",
              finish: payload.finish || "",
              memo: "" // 자율 양식 데이터 제거
            }
          : {
              memo: payload.memo || "",
              nose: "", // 기본 양식 데이터 제거
              palate: "",
              finish: ""
            })
      };

      const updatedNote = await notesApi.updateReview(Number(selected.id), reviewRequest);
      
      // 2. 로컬 상태 업데이트
      const updatedEntry = mapNoteResponseToEntry(updatedNote);
      setWhiskies(prev => prev.map(w => w.id === selected.id ? updatedEntry : w));

      if (flow === "B") {
        toast.success("기록이 저장되었습니다", {
          description: "오더 시트에 한 줄이 더해졌습니다."
        });
        setTimeout(() => {
          setMode("list");
          setSelected(null);
        }, 350);
      } else {
        // Flow A: 익명 제출 시 라운지 데이터 리프레시 후 이동
        await fetchLoungeFeed(); // 라운지 목록 최신화
        setTimeout(() => {
          setView("lounge");
          setMode("list");
          setSelected(null);
          toast("게시판에 핀으로 꽂혔습니다 🍂");
        }, 500);
      }
    } catch (error) {
      console.error("Failed to submit review:", error);
      toast.error("저장에 실패했습니다.");
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden notes-font-all">
      {/* 배경 전환 */}
      <AnimatePresence mode="wait">
        {view === "notes" ? (
          <motion.div
            key="desk"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-notes-desk min-h-screen w-full flex items-center justify-center pt-20 md:pt-24 pb-6 md:pb-10 px-3 md:px-0"
          >
            <motion.div
              key="mynote"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="relative w-full flex justify-center"
            >
              <div className="relative w-[min(1200px,95vw)]">
                <Bookmark label="스크랩북" onClick={() => setView("scrapbook")} />
                <DiaryFrame
                  rightId="paper-right"
                  left={
                    mode === "review" && selected ? (
                      <MemoCard whisky={selected} />
                    ) : (
                      <LeatherIntro />
                    )
                  }
                  right={
                  <>
                    {mode === "list" && <HelpGuide parentView={view} />}
                    <AnimatePresence mode="wait">                        {mode === "list" || !selected ? (
                          <motion.div
                            key="list"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.35 }}
                            className="h-full"
                          >
                            <PersonalListView
                              whiskies={whiskies}
                              onSelect={handleSelect}
                            />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="review"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.35 }}
                            className="h-full"
                          >
                            <ReviewView
                              whisky={selected}
                              onBack={handleBack}
                              onSubmit={handleSubmit}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  }
                />
              </div>
            </motion.div>
          </motion.div>
        ) : view === "scrapbook" ? (
          <motion.div
            key="scrapbook-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-notes-desk min-h-screen w-full flex items-center justify-center pt-20 md:pt-24 pb-6 md:pb-10 px-3 md:px-0"
          >
            <motion.div
              key="scrapbook"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="relative w-full flex justify-center"
            >
              <div className="relative w-[min(1200px,95vw)]">
                <Bookmark
                  label="내 노트로 돌아가기"
                  onClick={() => setView("notes")}
                  active
                />
                <ScrapbookView notes={scrappedNotes} />
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="lounge"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <LoungeBoard
              notes={loungeNotesData}
              scrappedIds={scrappedIds}
              onToggleScrap={toggleScrap}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 홈으로 돌아가기 버튼 (좌측 상단으로 이동) */}
      <button
        onClick={() => router.push("/main")}
        className="absolute top-6 left-6 z-50 px-4 py-2 bg-black/40 border border-white/10 rounded-full text-white/80 text-sm hover:bg-black/60 transition-all backdrop-blur-sm"
      >
        ← 메인으로
      </button>

      <TopNav
        view={view}
        onChange={(v) => {
          setView(v);
          if (v === "notes" && mode !== "review") setMode("list");
        }}
      />
    </div>
  );
}

const LeatherIntro = () => (
  <div className="h-full flex flex-col justify-between text-[#fdfbf7]/90">
    <div>
      <p className="text-xs uppercase tracking-[0.4em] opacity-70">
        The Whisky Bar
      </p>
      <h2 className="font-serif text-3xl mt-2 leading-snug">
        가죽 다이어리에
        <br />
        오늘의 한 잔을
        <br />
        새겨 두세요
      </h2>
      <div className="mt-6 space-y-2 text-sm opacity-80 italic font-serif">
        <p>— 우측의 위스키를 선택하면</p>
        <p>이곳에 그날의 기억이 펼쳐집니다.</p>
      </div>
    </div>
    <div className="text-[10px] uppercase tracking-[0.5em] opacity-50">
      Est. 2026 · Vol. 1
    </div>
  </div>
);
