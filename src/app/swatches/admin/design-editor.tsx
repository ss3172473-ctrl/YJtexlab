"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowDown, ArrowUp, Upload } from "lucide-react";
import type { Pattern } from "../catalog";
import { arrangeSpecimens, curateSpecimens } from "../curation";
import SpecimenGrid from "../specimen-grid";
import swatches from "../swatches.module.css";
import { emptySwatchesLayout, packSwatchesRows, swatchesDefaultSpan, type SwatchesLayout } from "../design-layout";
import styles from "./design-editor.module.css";

type DesignReply = { layout: SwatchesLayout; patterns: Pattern[]; writable: boolean; photoWritable: boolean };
const endpoint = "/api/swatches/design";

function patchEntry<T extends number | string>(entries: Record<string, T>, name: string, value?: T) {
  const next = { ...entries };
  if (value === undefined) delete next[name];
  else next[name] = value;
  return next;
}

export default function DesignEditor() {
  const [state, setState] = useState<"loading" | "login" | "editing">("loading");
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [saved, setSaved] = useState<SwatchesLayout>(emptySwatchesLayout);
  const [draft, setDraft] = useState<SwatchesLayout>(emptySwatchesLayout);
  const [writable, setWritable] = useState(false);
  const [photoWritable, setPhotoWritable] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [automaticHeight, setAutomaticHeight] = useState(300);
  const preview = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState("");
  const curated = useMemo(() => curateSpecimens(patterns), [patterns]);
  const { order, covers, sizes, rowHeights, columns, columnGap, rowGap } = draft;
  const specimens = useMemo(() => arrangeSpecimens(curated, order, covers), [curated, order, covers]);
  const names = useMemo(() => specimens.map(({ group }) => group.name), [specimens]);
  const placement = useMemo(() => packSwatchesRows(names, sizes, columns), [names, sizes, columns]);
  const index = Math.max(0, names.indexOf(selected));
  const current = specimens[index];
  const name = current?.group.name ?? "";
  const row = String(placement[index]?.row ?? 1);
  const height = rowHeights[row];
  const dirty = JSON.stringify(saved) !== JSON.stringify(draft);

  const load = useCallback(async () => {
    setError("");
    try {
      const response = await fetch(endpoint, { cache: "no-store" });
      if (response.status === 401) {
        setState("login");
        return;
      }
      if (!response.ok) throw new Error((await response.json()).error);
      const data: DesignReply = await response.json();
      setPatterns(data.patterns);
      setSaved(data.layout);
      setDraft(data.layout);
      setWritable(data.writable);
      setPhotoWritable(data.photoWritable);
      setState("editing");
    } catch (failure) {
      setState("login");
      setError(failure instanceof Error ? failure.message : "편집 정보를 불러오지 못했습니다.");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (height || !name) return;
    const container = preview.current;
    if (!container) return;
    const measure = () => {
      const cards = container.querySelectorAll<HTMLElement>(`[data-row="${row}"] [data-sku]`);
      const height = Math.max(130, ...Array.from(cards, (card) => card.offsetHeight));
      setAutomaticHeight(Math.min(620, height));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [height, name, row, sizes, order, columns, columnGap]);

  async function uploadPhoto(file: File, sku: string) {
    if (file.size > 20 * 1024 * 1024) {
      setError("사진은 20MB 이하로 올려 주세요.");
      return;
    }
    setUploading(true);
    setNotice("");
    setError("");
    try {
      const response = await fetch(`${endpoint}/photo?sku=${encodeURIComponent(sku)}`, {
        method: "POST", body: file,
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.image) throw new Error(result?.error || "사진을 올리지 못했습니다.");
      const image: string = result.image;
      setPatterns((previous) => previous.map((pattern) => ({ ...pattern, variants: pattern.variants.map((variant) =>
        variant.sku === sku ? { ...variant, image } : variant) })));
      setNotice(`${sku} 사진을 저장했습니다.`);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "사진을 올리지 못했습니다.");
    } finally {
      setUploading(false);
    }
  }

  function edit(change: (current: SwatchesLayout) => SwatchesLayout) {
    setDraft(change);
    setNotice("");
    setError("");
  }

  function move(from: number, target: number) {
    if (!writable || busy || from < 0 || !Number.isInteger(target) || target < 0 || target >= names.length || target === from) return;
    const order = [...names];
    const [pattern] = order.splice(from, 1);
    order.splice(target, 0, pattern);
    setSelected(pattern);
    edit((current) => ({ ...current, order }));
  }

  function changeHeight(value?: number) {
    edit((current) => ({ ...current, rowHeights: patchEntry(current.rowHeights, row, value) }));
  }

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      if (!response.ok) throw new Error((await response.json()).error);
      setKey("");
      await load();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "접속할 수 없습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    try {
      if (!(await fetch(endpoint, { method: "DELETE" })).ok) throw new Error();
      setPatterns([]);
      setSelected("");
      setSaved(emptySwatchesLayout);
      setDraft(emptySwatchesLayout);
      setNotice("");
      setError("");
      setState("login");
    } catch {
      setError("로그아웃하지 못했습니다. 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!response.ok) throw new Error((await response.json()).error);
      const data = await response.json();
      setSaved(data.layout);
      setDraft(data.layout);
      setNotice("저장했습니다. 원단 목록을 새로 열면 반영됩니다.");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "배치 설정을 저장하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return <main className={`${swatches.shell} ${styles.page}`} lang="ko">
    <header className={styles.header}>
      <h1>Swatches 편집</h1>
      <div className={styles.actions}>
        <Link href="/swatches">원단 목록</Link>
        {state === "editing" && <button type="button" onClick={() => void signOut()} disabled={busy || uploading}>로그아웃</button>}
      </div>
    </header>
    {state !== "editing" && <div className={styles.feedback} aria-live="polite">
      {error && <p className={styles.error}>{error}</p>}
      {notice && <p>{notice}</p>}
    </div>}
    {state === "loading" && <p role="status">불러오는 중</p>}
    {state === "login" && <form className={styles.login} onSubmit={signIn}>
      <label htmlFor="design-key">관리자 키</label>
      <input id="design-key" type="password" autoComplete="current-password" value={key} maxLength={512} required
        disabled={busy} onChange={(event) => setKey(event.target.value)} />
      <button type="submit" className={styles.primary} disabled={busy || !key}>{busy ? "확인 중" : "접속"}</button>
    </form>}
    {state === "editing" && <>
      <div className={styles.toolbar}>
        <div className={styles.toolbarTop}>
          <div className={styles.selection}>
            <strong>{name}</strong>
            <span>{name ? `${row}행 · ${names.length}개 패턴` : "표시할 패턴이 없습니다."}</span>
          </div>
          <div className={styles.actions}>
            {current && <>
              <input ref={fileInput} type="file" aria-label="원단 사진 파일" accept="image/jpeg,image/png,image/webp,image/avif" hidden
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  event.currentTarget.value = "";
                  if (file) void uploadPhoto(file, current.representative.sku);
                }} />
              <button type="button" className={styles.upload} onClick={() => fileInput.current?.click()}
                disabled={!photoWritable || uploading || busy} title={photoWritable ? `${current.representative.sku} 사진 교체` : "사진 저장소 연결 필요"}>
                <Upload size={14} /> {uploading ? "올리는 중" : `사진 올리기 · ${current.representative.sku}`}
              </button>
            </>}
            <button type="button" onClick={() => edit(() => saved)} disabled={!dirty || busy}>저장본으로 되돌리기</button>
            <button type="button" className={styles.primary} onClick={() => void save()}
              disabled={!dirty || busy || !writable}>{busy ? "저장 중" : "배치 저장"}</button>
          </div>
        </div>
        {current && <fieldset className={styles.controls} disabled={busy || !writable}>
          <div className={styles.control}>
            <label htmlFor="design-position">패턴 위치</label>
            <div className={styles.position}>
              <button type="button" aria-label="앞으로 이동" onClick={() => move(index, index - 1)} disabled={index === 0}>
                <ArrowUp size={15} />
              </button>
              <input id="design-position" key={`${name}-${index}`} type="number" inputMode="numeric" min={1}
                max={names.length} defaultValue={index + 1}
                onBlur={(event) => {
                  const target = event.currentTarget.valueAsNumber;
                  event.currentTarget.value = String(index + 1);
                  move(index, target - 1);
                }}
                onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} />
              <button type="button" aria-label="뒤로 이동" onClick={() => move(index, index + 1)} disabled={index === names.length - 1}>
                <ArrowDown size={15} />
              </button>
            </div>
          </div>
          <div className={styles.control}>
            <label htmlFor="design-cover">대표 색상</label>
            <select id="design-cover" value={draft.covers[name] ?? ""} onChange={(event) => {
              const value = event.currentTarget.value || undefined;
              edit((layout) => ({ ...layout, covers: patchEntry(layout.covers, name, value) }));
            }}>
              <option value="">자동 선택</option>
              {current.group.variants.map(({ sku, color }) => <option key={sku} value={sku}>{color} · {sku}</option>)}
            </select>
          </div>
          <div className={styles.control}>
            <label htmlFor="design-size">카드 너비</label>
            <select id="design-size" value={draft.sizes[name] ?? ""} onChange={(event) => {
              const value = event.currentTarget.value ? Number(event.currentTarget.value) : undefined;
              edit((layout) => ({ ...layout, sizes: patchEntry(layout.sizes, name, value) }));
            }}>
              <option value="">자동 ({swatchesDefaultSpan()}열)</option>
              {[1, 2, 3].map((width) => <option key={width} value={width}>{width}열</option>)}
            </select>
          </div>
          <div className={styles.control}>
            <label htmlFor="design-height">{row}행 높이 <output htmlFor="design-height">{height ? `${height}px` : "자동"}</output></label>
            <div className={styles.height}>
              <input id="design-height" aria-label={`${row}행 높이`} type="range" min={130} max={620}
                value={height ?? automaticHeight} onChange={(event) => changeHeight(event.currentTarget.valueAsNumber)} />
              <button type="button" onClick={() => changeHeight()} disabled={!height}>자동</button>
            </div>
          </div>
        </fieldset>}
        <details className={styles.gridSettings}>
          <summary>그리드 설정</summary>
          <fieldset disabled={busy || !writable}>
            <label>열 수 <select value={columns ?? 5}
              onChange={(event) => {
                const value = Number(event.currentTarget.value);
                edit((layout) => ({ ...layout, columns: value }));
              }}>
              {[4, 5, 6, 7, 8].map((count) => <option key={count} value={count}>{count}열</option>)}
            </select></label>
            <label>열 간격 <input aria-label="열 간격" type="range" min={12} max={44}
              value={columnGap ?? 28} onChange={(event) => {
                const value = event.currentTarget.valueAsNumber;
                edit((layout) => ({ ...layout, columnGap: value }));
              }} /> <output>{columnGap ?? 28}px</output></label>
            <label>줄 간격 <input aria-label="줄 간격" type="range" min={24} max={100}
              value={rowGap ?? 86} onChange={(event) => {
                const value = event.currentTarget.valueAsNumber;
                edit((layout) => ({ ...layout, rowGap: value }));
              }} /> <output>{rowGap ?? 86}px</output></label>
          </fieldset>
        </details>
        <div className={styles.feedback} aria-live="polite">
          {error ? <p className={styles.error}>{error}</p> : notice ? <p>{notice}</p> :
            <p>{writable ? "카드를 끌어 순서를 바꾸거나, 색상을 선택해 해당 SKU의 사진을 올리세요." : "현재 미리보기에서 배치 저장소가 연결되지 않았습니다."}</p>}
        </div>
      </div>
      <div ref={preview} className={styles.preview}>
        <SpecimenGrid patterns={patterns} language="ko" query="" onQuery={() => undefined}
          onOpen={(group) => setSelected(group.name)} layout={draft}
          editor={{ selected: name, onMove: (from, to) => move(names.indexOf(from), names.indexOf(to)) }} />
      </div>
    </>}
  </main>;
}
