"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUpRight, Check, Copy, KeyRound, LogOut, Plus, RefreshCw, Search, ShieldCheck, Users, X } from "lucide-react";
import styles from "./crm.module.css";
import Link from "next/link";

type Contact = { id: string; email: string; isPrimary: boolean; suppressed: boolean };
type Company = { id: string; name: string; contacts: Contact[]; codeIssued: boolean; canViewPrices: boolean; updatedAt: string };
type Session = { authenticated: boolean; email?: string };
const adminEmail = "yjtexlab@gmail.com";
const primaryEmail = (company: Company) => (company.contacts.find((contact) => contact.isPrimary) ?? company.contacts[0])?.email ?? "";

class ApiError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}
async function api<T>(path: string, method = "GET", body?: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`/api/crm${path}`, {
    method, credentials: "same-origin", cache: "no-store", signal,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(typeof data?.error === "string" ? data.error : `요청을 처리하지 못했어요. (${response.status})`, response.status);
  return data as T;
}

export default function CrmAdmin() {
  const [session, setSession] = useState<Session | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [token, setToken] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [query, setQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [editVersion, setEditVersion] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [issued, setIssued] = useState<{ companyId: string; code: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const requestId = useRef(0);
  const selected = companies.find((company) => company.id === selectedId);

  const handleError = useCallback((failure: unknown) => {
    if (failure instanceof ApiError && failure.status === 401) {
      setSession({ authenticated: false }); setIssued(null); setCompanies([]); setSelectedId(null); setOtpSent(false); setToken("");
    }
    setError(failure instanceof Error ? failure.message : "요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.");
  }, []);

  const load = useCallback(async (search: string, signal?: AbortSignal, pageOffset = offset) => {
    const id = ++requestId.current;
    setLoading(true);
    try {
      const data = await api<{ companies: Company[]; nextOffset: number | null }>(`/companies?q=${encodeURIComponent(search)}&offset=${pageOffset}`, "GET", undefined, signal);
      if (id === requestId.current) { setCompanies(data.companies); setNextOffset(data.nextOffset); }
    } finally { if (id === requestId.current) setLoading(false); }
  }, [offset]);

  useEffect(() => {
    const controller = new AbortController();
    api<Session>("/session", "GET", undefined, controller.signal).then(setSession).catch((failure) => {
      if (!controller.signal.aborted) { setSession({ authenticated: false }); handleError(failure); }
    });
    return () => controller.abort();
  }, [handleError]);

  useEffect(() => {
    if (!session?.authenticated) return;
    const controller = new AbortController();
    const timer = setTimeout(() => { load(query, controller.signal).catch((failure) => { if (!controller.signal.aborted) handleError(failure); }); }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, session?.authenticated, load, handleError]);

  async function run(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true); setError(""); setNotice("");
    try { await action(); } catch (failure) { handleError(failure); } finally { setBusy(false); }
  }

  function choose(company: Company) {
    setSelectedId(company.id); setCreating(false); setName(company.name); setEmail(primaryEmail(company)); setEditVersion(company.updatedAt);
    setIssued(null); setCopied(false); setError(""); setNotice("");
  }
  function startCreate() {
    setSelectedId(null); setCreating(true); setName(""); setEmail(""); setIssued(null); setNotice(""); setError("");
  }
  async function authenticate(event: FormEvent) {
    event.preventDefault();
    await run(async () => {
      if (!otpSent) {
        await api("/session", "POST", { email: adminEmail }); setOtpSent(true); setNotice("이메일로 받은 인증번호를 입력해 주세요.");
      } else {
        await api("/session", "PUT", { email: adminEmail, token: token.trim() });
        const current = await api<Session>("/session");
        if (!current.authenticated) throw new Error("로그인을 확인하지 못했어요. 인증번호를 다시 요청해 주세요.");
        setSession(current); setToken(""); setNotice("");
      }
    });
  }
  async function saveCompany(event: FormEvent) {
    event.preventDefault();
    await run(async () => {
      const payload = { name: name.trim(), email: email.trim() };
      if (creating) {
        await api("/companies", "POST", payload);
        setCreating(false); setQuery(""); setOffset(0); await load("", undefined, 0); setNotice("업체를 등록했어요. 목록에서 선택해 입장 코드를 발급하세요.");
      } else if (selected) {
        const result = await api<{ company: Company }>(`/companies/${selected.id}`, "PATCH", { ...payload, expectedUpdatedAt: editVersion }); setEditVersion(result.company.updatedAt); await load(query); setNotice("업체 정보가 저장됐어요.");
      }
    });
  }
  async function changeCode(action: "issue" | "reissue" | "revoke") {
    if (!selected) return;
    const company = selected;
    if (action !== "issue" && !window.confirm(action === "reissue" ? `${company.name}의 코드를 재발급할까요? 기존 코드는 즉시 사용할 수 없게 됩니다.` : `${company.name}의 코드를 폐기할까요? 고객이 더 이상 이 코드로 접속할 수 없습니다.`)) return;
    await run(async () => {
      setIssued(null); setCopied(false);
      const result = await api<{ code?: string }>(`/companies/${company.id}/code`, "POST", { action, expectedUpdatedAt: company.updatedAt });
      if (result.code) setIssued({ companyId: company.id, code: result.code });
      await load(query);
      setNotice(action === "revoke" ? "코드를 폐기했어요." : "코드가 발급됐어요. 바로 사용할 수 있습니다.");
    });
  }
  async function changePrice() {
    if (!selected) return;
    const company = selected;
    const next = !company.canViewPrices;
    if (!window.confirm(`${company.name}에 가격을 ${next ? "공개" : "비공개"}할까요? 이 업체에만 적용됩니다.`)) return;
    await run(async () => {
      await api(`/companies/${company.id}`, "PATCH", { canViewPrices: next, expectedUpdatedAt: company.updatedAt });
      await load(query); setNotice(`${company.name}의 가격을 ${next ? "공개" : "비공개"}로 변경했어요.`);
    });
  }

  const messages = <div className={styles.messages} aria-live="polite">
    {error && <div role="alert" className={styles.error}>{error}</div>}
    {notice && <div className={styles.notice}><Check size={17} aria-hidden="true" />{notice}</div>}
  </div>;

  return <main className={styles.app}>
    <header className={styles.header}>
      <Link href="/" className={styles.brand} aria-label="YJ TexLab 홈">YJ TEXLAB<span>OPERATIONS</span></Link>
      <div className={styles.headerRight}><span className={styles.privateLabel}><ShieldCheck size={14} />관리자 전용</span>
        {session?.authenticated && <button className={styles.logout} disabled={busy} onClick={() => run(async () => { await api("/session", "DELETE"); setSession({ authenticated: false }); setCompanies([]); setSelectedId(null); setIssued(null); setCreating(false); setName(""); setEmail(""); setOtpSent(false); })}><LogOut size={15} />로그아웃</button>}
      </div>
    </header>
    {!session ? <div className={styles.center} role="status">로그인 상태를 확인하고 있어요…</div> : !session.authenticated ? <section className={styles.login}>
      <div className={styles.iconTile}><KeyRound size={25} /></div>
      <p className={styles.eyebrow}>CUSTOMER WORKSPACE</p><h1>고객 관리에 로그인</h1>
      <p className={styles.muted}>회사와 입장 코드, 가격 공개 권한을<br />한곳에서 관리하세요.</p>
      {messages}
      <form onSubmit={authenticate}>
        <label className={styles.label}>관리자 이메일<input type="email" value={adminEmail} readOnly autoComplete="username" /></label>
        {otpSent && <label className={styles.label}>이메일 인증번호<input autoFocus required value={token} onChange={(event) => setToken(event.target.value)} autoComplete="one-time-code" inputMode="numeric" maxLength={12} placeholder="받은 인증번호 입력" /></label>}
        <button className={styles.primary} disabled={busy || (otpSent && !token.trim())}>{busy ? "처리 중…" : otpSent ? "로그인" : "이메일로 인증번호 받기"}<ArrowUpRight size={17} /></button>
      </form>
      {otpSent && <button className={styles.textButton} disabled={busy} onClick={() => run(async () => { await api("/session", "POST", { email: adminEmail }); setNotice("인증번호를 다시 보냈어요. 가장 최근 번호를 입력하세요."); })}>인증번호 다시 받기</button>}
      <p className={styles.small}>등록된 관리자만 접근할 수 있습니다.</p>
    </section> : <div className={styles.workspace}>
      <section className={styles.intro}><div><p className={styles.eyebrow}>CUSTOMER WORKSPACE</p><h1>고객 관리<span>.</span></h1><p className={styles.muted}>업체 정보부터 입장 코드, 가격 공개까지.</p></div><button className={styles.primary} disabled={busy} onClick={startCreate}><Plus size={17} />업체 등록</button></section>
      {messages}
      <div className={styles.grid}>
        <section className={styles.directory} aria-label="업체 목록">
          <div className={styles.directoryTop}><h2>업체 목록 <span>{companies.length}</span></h2><button className={styles.iconButton} aria-label="업체 목록 새로고침" disabled={busy || loading} onClick={() => run(() => load(query))}><RefreshCw size={16} /></button></div>
          <label className={styles.search}><Search size={17} aria-hidden="true" /><input aria-label="업체명 또는 이메일 검색" placeholder="업체명 또는 이메일 검색" value={query} onChange={(event) => { setQuery(event.target.value); setOffset(0); }} disabled={busy} />{query && <button aria-label="검색어 지우기" onClick={() => { setQuery(""); setOffset(0); }}><X size={15} /></button>}</label>
          <div className={styles.list} aria-busy={loading}>
            {loading && <p className={styles.listStatus} role="status">목록을 불러오고 있어요…</p>}
            {!loading && !companies.length && <div className={styles.empty}><Users size={27} /><p>{query ? "검색 결과가 없어요." : "등록된 업체가 없어요."}</p><span>{query ? "다른 업체명이나 이메일로 검색해 보세요." : "첫 업체를 등록하고 코드를 발급하세요."}</span></div>}
            {companies.map((company) => <button key={company.id} className={`${styles.company} ${selectedId === company.id && !creating ? styles.selected : ""}`} onClick={() => choose(company)} disabled={busy} aria-pressed={selectedId === company.id && !creating}>
              <span className={styles.avatar}>{company.name.slice(0, 1).toUpperCase()}</span><span className={styles.companyInfo}><strong>{company.name}</strong><span>{primaryEmail(company) || "이메일 없음"}</span><span className={styles.badges}><span className={company.codeIssued ? styles.good : styles.neutral}>{company.codeIssued ? "코드 발급됨" : "코드 없음"}</span><span className={styles.neutral}>가격 {company.canViewPrices ? "공개" : "비공개"}</span></span></span>
            </button>)}
          </div>
          <div className={styles.pagination}><button disabled={busy || loading || offset === 0} onClick={() => { setSelectedId(null); setIssued(null); setOffset(Math.max(0, offset - 100)); }}>이전</button><span>{Math.floor(offset / 100) + 1} 페이지</span><button disabled={busy || loading || nextOffset === null} onClick={() => { if (nextOffset !== null) { setSelectedId(null); setIssued(null); setOffset(nextOffset); } }}>다음</button></div>
          <p className={styles.directoryNote}>코드는 업체 상세에서 발급할 때 확인할 수 있어요.</p>
        </section>
        <section className={styles.detail} aria-label="업체 상세">
          {!creating && !selected ? <div className={styles.placeholder}><div className={styles.iconTile}><Users size={25} /></div><h2>관리할 업체를 선택하세요</h2><p>입장 화면의 업체명과 발송 이메일은<br />같은 업체 정보에 연결됩니다.</p><button className={styles.textButton} onClick={startCreate} disabled={busy}>새 업체 등록 <ArrowUpRight size={15} /></button></div> : <>
            <div className={styles.detailHeading}><p className={styles.eyebrow}>{creating ? "NEW COMPANY" : "COMPANY DETAILS"}</p><h2>{creating ? "새 업체 등록" : selected?.name}</h2>{!creating && <p className={styles.small}>고객 접속 화면에 표시되는 업체명입니다.</p>}</div>
            <form onSubmit={saveCompany} className={styles.companyForm}><div className={styles.fields}><label className={styles.label}>업체명<input required maxLength={200} value={name} onChange={(event) => setName(event.target.value)} disabled={busy} placeholder="예: Fabric Studio" /></label><label className={styles.label}>대표 이메일<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={busy} maxLength={254} placeholder="buyer@company.com" /></label></div><button className={styles.secondary} disabled={busy || !name.trim() || !email.trim()}>{creating ? "업체 등록" : "정보 저장"}</button></form>
            {!creating && selected && <>
              {selected.contacts.some((contact) => contact.suppressed) && <p className={styles.warning}>발송이 제한된 연락처가 있어요. 코드를 발급해도 발송 제한은 해제되지 않습니다.</p>}
              {selected.contacts.length > 1 && <div className={styles.extraContacts}><h3>연결된 연락처</h3>{selected.contacts.map((contact) => <p key={contact.id}>{contact.email}<span>{contact.isPrimary ? "대표" : "추가"}{contact.suppressed ? " · 발송 제한" : ""}</span></p>)}</div>}
              <div className={styles.setting}><div className={styles.settingTitle}><KeyRound size={19} /><h3>입장 코드</h3><span className={selected.codeIssued ? styles.good : styles.neutral}>{selected.codeIssued ? "발급됨" : "미발급"}</span></div><p>발급 즉시 사용할 수 있어요. 별도의 활성화는 필요하지 않습니다.</p>
                {issued?.companyId === selected.id && <div className={styles.codeBox}><div><span>이 화면을 벗어나기 전에 복사하세요</span><code>{issued.code}</code></div><button className={styles.secondary} disabled={busy} onClick={async () => { try { await navigator.clipboard.writeText(issued.code); setCopied(true); } catch { setError("복사하지 못했어요. 표시된 코드를 직접 선택해 복사해 주세요."); } }}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? "복사됨" : "복사"}</button></div>}
                <div className={styles.actions}>{!selected.codeIssued ? <button className={styles.primary} disabled={busy} onClick={() => changeCode("issue")}><Plus size={16} />코드 발급</button> : <><button className={styles.secondary} disabled={busy} onClick={() => changeCode("reissue")}><RefreshCw size={15} />재발급</button><button className={styles.danger} disabled={busy} onClick={() => changeCode("revoke")}>코드 폐기</button></>}</div>
              </div>
              <div className={styles.setting}><div className={styles.settingTitle}><ShieldCheck size={19} /><h3>가격 공개</h3><span className={selected.canViewPrices ? styles.good : styles.neutral}>{selected.canViewPrices ? "공개" : "비공개"}</span></div><p>기본은 비공개예요. 변경을 승인하면 이 업체에만 적용됩니다.</p><button className={styles.secondary} disabled={busy} onClick={changePrice}>{selected.canViewPrices ? "비공개로 변경" : "가격 공개 승인"}<ArrowUpRight size={15} /></button></div>
              <div className={styles.detailFooter}><span>최근 변경</span><time dateTime={selected.updatedAt}>{new Date(selected.updatedAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })} KST</time></div>
            </>}
          </>}
        </section>
      </div>
      <footer className={styles.footer}><span>YJ TEXLAB · 고객 관리</span><a href="/swatches" target="_blank" rel="noreferrer">고객용 컬렉션 보기 <ArrowUpRight size={14} /></a></footer>
    </div>}
  </main>;
}
