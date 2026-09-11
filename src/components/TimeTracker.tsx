import { useState, useEffect, useRef, useCallback } from "react";

const PATHS = [
  "Knowledge Base",
  "GenAI",
  "Read",
  "Java",
  "Algorithms & Data Structures",
  "React Projects",
  "System Design",
];

const RECENT_PATHS = ["Knowledge Base", "GenAI", "Read", "Java", "Algorithms & Data Structures"];
const INITIAL_LABELS = ["Focus", "Deep Work", "Review", "Planning", "Research"];

function ChevronIcon({ open }: { open?: boolean }) {
  return (
    <svg width="9" height="9" viewBox="0 0 9 9" fill="none"
      className={`transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`}>
      <path d="M1.5 3L4.5 6.5L7.5 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
      <path d="M1 1L6 6M6 1L1 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function nowHHMM() {
  const n = new Date();
  return `${n.getHours().toString().padStart(2, "0")}:${n.getMinutes().toString().padStart(2, "0")}`;
}

function parseHHMM(val: string): { h: number; m: number } | null {
  const parts = val.trim().split(":").map(Number);
  if (parts.length !== 2 || parts.some(isNaN)) return null;
  const [h, m] = parts;
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return { h, m };
}

function elapsedSince(h: number, m: number): number {
  const now = new Date();
  const startMs = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0).getTime();
  return Math.max(0, Math.floor((now.getTime() - startMs) / 1000));
}

function formatElapsed(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m`;
  return `${m}m ${sec.toString().padStart(2, "0")}s`;
}

export default function TimeTracker() {
  const [running, setRunning] = useState(false);
  const [startTime, setStartTime] = useState<{ h: number; m: number } | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [editingTime, setEditingTime] = useState(false);
  const [timeInput, setTimeInput] = useState("");

  const [selectedPath, setSelectedPath] = useState("");
  const [pathOpen, setPathOpen] = useState(false);
  const [descOpen, setDescOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [allLabels, setAllLabels] = useState<string[]>(INITIAL_LABELS);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [labelOpen, setLabelOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [labelSearch, setLabelSearch] = useState("");

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pathRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);
  const timeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (running && startTime) {
      const tick = () => setElapsed(elapsedSince(startTime.h, startTime.m));
      tick();
      intervalRef.current = setInterval(tick, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, startTime]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (pathRef.current && !pathRef.current.contains(e.target as Node)) setPathOpen(false);
      if (labelRef.current && !labelRef.current.contains(e.target as Node)) setLabelOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (descOpen) setTimeout(() => descRef.current?.focus(), 50);
  }, [descOpen]);

  const displayStartTime = startTime
    ? `${startTime.h.toString().padStart(2, "0")}:${startTime.m.toString().padStart(2, "0")}`
    : nowHHMM();

  const handleToggle = useCallback(() => {
    if (running) {
      setRunning(false);
      setStartTime(null);
      setElapsed(0);
    } else {
      const parsed = parseHHMM(displayStartTime);
      const st = parsed ?? { h: new Date().getHours(), m: new Date().getMinutes() };
      setStartTime(st);
      setRunning(true);
    }
  }, [running, displayStartTime]);

  const openTimeEdit = () => {
    setTimeInput(displayStartTime);
    setEditingTime(true);
    setTimeout(() => timeInputRef.current?.select(), 30);
  };

  const commitTimeEdit = () => {
    const parsed = parseHHMM(timeInput);
    if (parsed) {
      setStartTime(parsed);
      if (running) setElapsed(elapsedSince(parsed.h, parsed.m));
    }
    setEditingTime(false);
  };

  const toggleLabel = (label: string) =>
    setSelectedLabels((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );

  const createLabel = () => {
    const trimmed = newLabel.trim();
    if (!trimmed || allLabels.includes(trimmed)) return;
    setAllLabels((prev) => [...prev, trimmed]);
    setSelectedLabels((prev) => [...prev, trimmed]);
    setNewLabel("");
  };

  const filteredLabels = allLabels.filter((l) =>
    l.toLowerCase().includes(labelSearch.toLowerCase())
  );

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[560px]">
      {descOpen && (
        <div className="mb-1 bg-[#1c1c25] border border-[#2a2a38] rounded-xl px-3 py-2 shadow-2xl">
          <textarea
            ref={descRef}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What are you working on..."
            rows={2}
            className="w-full bg-transparent text-xs text-[#ccccdd] placeholder-[#3a3a4a] resize-y focus:outline-none leading-relaxed"
            style={{ minHeight: "40px", maxHeight: "120px" }}
          />
        </div>
      )}

      <div className="bg-[#1c1c25] border border-[#2a2a38] rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 pt-3 pb-2">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[10px] text-[#444455] leading-none">Start</span>
            {editingTime ? (
              <input
                ref={timeInputRef}
                value={timeInput}
                onChange={(e) => setTimeInput(e.target.value)}
                onBlur={commitTimeEdit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitTimeEdit();
                  if (e.key === "Escape") setEditingTime(false);
                }}
                className="font-mono text-sm font-semibold tracking-widest text-white bg-transparent border-b border-[#4aba8a]/60 focus:outline-none w-[42px]"
                style={{ fontVariantNumeric: "tabular-nums", fontFamily: "'JetBrains Mono', monospace" }}
                placeholder="HH:MM"
              />
            ) : (
              <button
                onClick={openTimeEdit}
                title="Click to set start time"
                className="font-mono text-sm font-semibold tracking-widest text-white cursor-text hover:text-[#aaaacc] transition-colors"
                style={{ fontVariantNumeric: "tabular-nums", fontFamily: "'JetBrains Mono', monospace" }}
              >
                {displayStartTime}
              </button>
            )}
          </div>

          {running && (
            <span className="text-[10px] text-[#555566] flex-shrink-0">
              {formatElapsed(elapsed)}
            </span>
          )}

          <button
            onClick={handleToggle}
            className={[
              "flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium border rounded-md transition-colors flex-shrink-0",
              running
                ? "border-[#c04444]/60 text-[#e06060] hover:bg-[#e05555]/10"
                : "border-[#3a7a5a]/60 text-[#4aba8a] hover:bg-[#4aba8a]/10",
            ].join(" ")}
          >
            {running ? (
              <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
                <rect x="0.5" y="0.5" width="6" height="6" rx="0.5" fill="currentColor" />
              </svg>
            ) : (
              <svg width="7" height="8" viewBox="0 0 7 8" fill="none">
                <path d="M1 0.8L6.5 4L1 7.2V0.8Z" fill="currentColor" />
              </svg>
            )}
            {running ? "Stop" : "Start"}
          </button>

          <div className="w-px h-3 bg-[#2a2a38] flex-shrink-0" />

          <div ref={pathRef} className="relative flex-1 min-w-0">
            <button
              onClick={() => setPathOpen((o) => !o)}
              className="flex items-center gap-1.5 text-xs w-full text-left"
            >
              <span className="text-[#444455] flex-shrink-0">Path</span>
              <span className={`truncate ${selectedPath ? "text-[#bbbbcc]" : "text-[#333344]"}`}>
                {selectedPath || "—"}
              </span>
              <ChevronIcon open={pathOpen} />
            </button>

            {pathOpen && (
              <div className="absolute bottom-full left-0 mb-2 bg-[#1c1c25] border border-[#2a2a38] rounded-xl shadow-2xl z-20 overflow-hidden min-w-[180px]">
                {PATHS.map((p) => (
                  <button
                    key={p}
                    onClick={() => { setSelectedPath(p); setPathOpen(false); }}
                    className={[
                      "w-full text-left px-3 py-1.5 text-xs hover:bg-[#252532] transition-colors whitespace-nowrap",
                      selectedPath === p ? "text-white" : "text-[#8888aa]",
                    ].join(" ")}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setDescOpen((o) => !o)}
            className={[
              "flex items-center gap-1 text-[11px] transition-colors flex-shrink-0",
              descOpen || description ? "text-[#8888aa]" : "text-[#333344] hover:text-[#555566]",
            ].join(" ")}
          >
            <svg width="11" height="10" viewBox="0 0 11 10" fill="none">
              <path d="M1 1.5h9M1 5h6.5M1 8.5h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            {description && (
              <span className="max-w-[80px] truncate text-[10px]">{description}</span>
            )}
            <ChevronIcon open={descOpen} />
          </button>
        </div>

        <div className="h-px bg-[#222230] mx-3" />

        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-hidden">
            <span className="text-[10px] text-[#333344] flex-shrink-0">Recent</span>
            <div className="flex gap-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {RECENT_PATHS.map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPath(p)}
                  className={[
                    "px-1.5 py-px text-[10px] border rounded-md transition-colors whitespace-nowrap flex-shrink-0",
                    selectedPath === p
                      ? "border-[#3a7a5a]/60 text-[#4aba8a] bg-[#4aba8a]/8"
                      : "border-[#252532] text-[#555566] hover:border-[#2e2e3e] hover:text-[#888899]",
                  ].join(" ")}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="w-px h-3 bg-[#2a2a38] flex-shrink-0" />

          <div ref={labelRef} className="relative flex items-center gap-1.5 flex-shrink-0">
            {selectedLabels.map((l) => (
              <span
                key={l}
                className="flex items-center gap-1 px-1.5 py-px bg-[#4aba8a]/8 border border-[#3a7a5a]/50 text-[#4aba8a] text-[10px] rounded-md"
              >
                {l}
                <button onClick={() => toggleLabel(l)} className="hover:text-white transition-colors">
                  <XIcon />
                </button>
              </span>
            ))}

            <button
              onClick={() => setLabelOpen((o) => !o)}
              className={[
                "flex items-center gap-1 text-[10px] transition-colors",
                labelOpen ? "text-[#8888aa]" : "text-[#333344] hover:text-[#666677]",
              ].join(" ")}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1.5 5h7M5 1.5v7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              Labels
            </button>

            {labelOpen && (
              <div className="absolute bottom-full right-0 mb-2 bg-[#1c1c25] border border-[#2a2a38] rounded-xl shadow-2xl z-20 overflow-hidden w-44">
                <div className="px-2.5 py-2 border-b border-[#222230]">
                  <input
                    autoFocus
                    value={labelSearch}
                    onChange={(e) => setLabelSearch(e.target.value)}
                    placeholder="Search labels..."
                    className="w-full bg-transparent text-[11px] text-[#ccccdd] placeholder-[#333344] focus:outline-none"
                  />
                </div>
                <div className="max-h-28 overflow-y-auto">
                  {filteredLabels.length === 0
                    ? <div className="px-3 py-2 text-[11px] text-[#333344]">No labels found</div>
                    : filteredLabels.map((l) => (
                      <button
                        key={l}
                        onClick={() => toggleLabel(l)}
                        className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] hover:bg-[#252532] transition-colors"
                      >
                        <span className={selectedLabels.includes(l) ? "text-white" : "text-[#8888aa]"}>{l}</span>
                        {selectedLabels.includes(l) && (
                          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                            <path d="M1 3.5L3 5.5L8 1" stroke="#4aba8a" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>
                    ))}
                </div>
                <div className="px-2.5 py-1.5 border-t border-[#222230] flex gap-1.5 items-center">
                  <input
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && createLabel()}
                    placeholder="New label..."
                    className="flex-1 min-w-0 bg-transparent text-[11px] text-[#ccccdd] placeholder-[#333344] focus:outline-none"
                  />
                  <button
                    onClick={createLabel}
                    disabled={!newLabel.trim() || allLabels.includes(newLabel.trim())}
                    className="text-[10px] text-[#4aba8a] disabled:text-[#2a2a38] disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                  >
                    Create
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
