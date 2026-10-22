"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { recommendationApi } from "@/api/whiskeyApi";
import { ApiResponseError } from "@/api/apiClient";
import type { WhiskeyTastingNoteRequest, WhiskeyTastingNoteResponse } from "@/type/ApiInterface";
import { PaperSelect } from "@/components/recommendations/PaperControls";
import WhiskeyBottleImage from "@/components/recommendations/WhiskeyBottleImage";
const empty: WhiskeyTastingNoteRequest = { nose: "", palate: "", finish: "", memo: "", tastedOn: null, rating: null, sentiment: null };
export default function VerifiedTastingNotePage() {
  const params = useParams<{ recommendationId: string }>();
  const id = Number(params.recommendationId);
  const [data, setData] = useState<WhiskeyTastingNoteResponse | null>(null);
  const [form, setForm] = useState<WhiskeyTastingNoteRequest>(empty);
  const [status, setStatus] = useState<string | null>(null);
  const [authExpired, setAuthExpired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reload, setReload] = useState(0);
  const busy = useRef(false);
  useEffect(() => {
    let active = true;
    setData(null);
    if (!Number.isSafeInteger(id) || id <= 0) { setStatus("추천 번호를 확인해 주세요."); setLoading(false); return; }
    setLoading(true); setStatus(null); setAuthExpired(false);
    void recommendationApi.getVerifiedTastingNote(id).then((value) => {
      if (!active) return; setData(value); setForm({ tastedOn: value.tastedOn, nose: value.nose ?? "", palate: value.palate ?? "",
        finish: value.finish ?? "", memo: value.memo ?? "", rating: value.rating ?? null, sentiment: value.sentiment ?? null });
    }).catch((caught) => { if (active) {
      setAuthExpired(caught instanceof ApiResponseError && caught.status === 401);
      setStatus(caught instanceof ApiResponseError && caught.status === 404 ? "내 추천 기록을 찾을 수 없어요." : "시음 기록을 불러오지 못했어요. 로그인 상태와 연결을 확인해 주세요.");
    }}).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, reload]);
  async function save(event: FormEvent) {
    event.preventDefault(); if (busy.current || !data) return;
    busy.current = true; setSaving(true); setStatus(null); setAuthExpired(false);
    try { const saved = await recommendationApi.putVerifiedTastingNote(id, form); setData(saved); setStatus("시음 기록을 저장했어요. 마신 뒤의 맛 반응만 다음 추천에 참고합니다."); }
    catch (caught) {
      setAuthExpired(caught instanceof ApiResponseError && caught.status === 401);
      setStatus(caught instanceof ApiResponseError && caught.status === 400
        ? "시음일·별점·입력 길이를 확인해 주세요. 내용이나 평가를 하나 이상 남겨주세요."
        : "저장하지 못했어요. 입력 내용은 그대로 있으니 다시 시도해 주세요.");
    } finally { busy.current = false; setSaving(false); }
  }
  const bottle = data?.recommendation.selected;
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  return <main className="min-h-screen bg-[#1a120d] px-6 py-8 text-stone-100">
    <div className="mx-auto max-w-xl"><Link href="/notes" className="text-sm text-stone-400 underline">내 시음 노트로</Link>
      <h1 className="mt-6 font-serif text-3xl">마신 뒤의 한 잔 기록</h1>
      <p className="mt-3 text-sm leading-6 text-stone-400">추천을 보고 든 첫인상과 실제 마신 느낌은 따로 기록해요.<br />시음한 뒤 원하는 항목만 남겨주세요.</p>
      {loading && <p role="status" className="mt-6">기록을 불러오는 중…</p>}
      {status && !data && <div role="status" className="mt-4 rounded border border-amber-300/30 p-4 text-sm leading-6">{status}
        {authExpired ? <Link href="/login" className="ml-2 underline">다시 로그인</Link> : !data && !loading && <button onClick={() => setReload(reload + 1)} className="ml-2 underline">다시 불러오기</button>}
      </div>}
      {data && <form onSubmit={save} className="mt-6 rounded-sm border border-[#4a3728] bg-[#efe2c9] p-6 text-stone-900">
        <p className="text-xs font-bold tracking-widest">R-WHISKEY · No. {String(id).padStart(3,"0")}</p>
        <h2 className="mt-3 font-serif text-xl font-bold">{bottle?.displayName ?? "이전 추천 기록"}</h2>
        {bottle?.edition && <p className="mt-1 text-sm text-stone-600">{bottle.edition}</p>}
        {!data.recommendation.snapshotAvailable && <p className="mt-2 text-xs leading-5 text-stone-600">이전 추천에는 당시 병입 상세 정보가 저장되지 않았어요. 추천 번호에 시음 기록을 남길 수 있습니다.</p>}
        {bottle && <WhiskeyBottleImage key={bottle.bottlingId} url={bottle.details?.experience?.imageUrl} name={bottle.displayName} />}
        <fieldset disabled={saving} className="mt-6 min-w-0 space-y-5">
          <label className="block text-sm font-semibold">시음한 날 (선택)<input type="date" min="1900-01-01" max={today} value={form.tastedOn ?? ""}
            onChange={(event) => setForm({ ...form, tastedOn: event.target.value || null })} className="mt-2 block w-full min-w-0 rounded border border-stone-500/60 bg-white/70 p-3" /></label>
          {([{ key: "nose", label: "향 — 코로 맡은 느낌" }, { key: "palate", label: "맛 — 입안에서 느낀 느낌" },
            { key: "finish", label: "여운 — 삼킨 뒤 남은 느낌" }, { key: "memo", label: "이 한 잔에 대한 메모" }] as const).map(({ key, label }) =>
            <label key={key} className="block text-sm font-semibold">{label} (선택)
              <textarea value={form[key] ?? ""} maxLength={key === "memo" ? 1000 : 500} onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                className="mt-2 block min-h-24 w-full rounded border border-stone-500/60 bg-white/70 p-3 text-sm font-normal" />
              <span className="mt-1 block text-right text-xs font-normal text-stone-600">{form[key]?.length ?? 0}/{key === "memo" ? 1000 : 500}</span>
            </label>)}
          <PaperSelect label="별점 (선택)" value={form.rating ? String(form.rating) : ""} onChange={(value) => setForm({ ...form, rating: value ? Number(value) : null })}
            options={[1,2,3,4,5].map((value) => ({ value: String(value), label: "★".repeat(value) + " " + value + "점" }))} />
          <fieldset><legend className="text-sm font-semibold">마셔보니 어떤가요? (선택)</legend>
            <div className="mt-3 grid grid-cols-2 gap-3">{([{ value: "LIKE", label: "다시 마시고 싶어요", Icon: ThumbsUp }, { value: "DISLIKE", label: "취향과 달랐어요", Icon: ThumbsDown }] as const).map(({ value, label, Icon }) =>
              <button key={value} type="button" aria-pressed={form.sentiment === value} onClick={() => setForm({ ...form, sentiment: form.sentiment === value ? null : value })}
                className={`flex min-h-14 items-center justify-center gap-2 rounded border p-2 text-xs ${form.sentiment === value ? "border-[#4a3728] bg-[#4a3728] text-white" : "border-[#4a3728]/40"}`}><Icon aria-hidden="true" size={18}/>{label}</button>)}</div>
            <p className="mt-2 text-xs leading-5 text-stone-600">별점은 맛 반응과 별개예요. 버튼을 선택할 때만 취향에 참고합니다.<br />저장한 반응을 해제하고 저장하면 중립으로 바뀝니다.</p>
          </fieldset>
          <button type="submit" className="min-h-11 w-full bg-[#111] px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{saving ? "시음 기록 저장 중…" : "시음 기록 저장"}</button>
          {status && <div role="status" className="rounded border border-[#4a3728]/30 bg-white/30 p-3 text-sm leading-6">{status}{authExpired && <Link href="/login" className="ml-2 underline">다시 로그인</Link>}</div>}
          {data.updatedAt && <p className="text-xs text-stone-600">마지막 저장: {new Date(data.updatedAt).toLocaleString("ko-KR")}</p>}
        </fieldset>
      </form>}
    </div>
  </main>;
}
