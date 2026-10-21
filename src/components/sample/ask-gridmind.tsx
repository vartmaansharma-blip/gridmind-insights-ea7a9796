import { useEffect, useId, useRef, useState } from "react";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Compass,
  Info,
  Search,
  RotateCcw,
  Workflow,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { explainSample, type AssistantMode } from "@/lib/assistant/explanation";
import type { SampleWorkspace } from "@/lib/sample/workspace";
import { AssistantComposer } from "./assistant-composer";
import { AssistantMessage, type AssistantTurn } from "./assistant-message";
import mark from "@/assets/gridmind-mark.png";
import "./ask-gridmind.css";
const starters = [
  {
    title: "Understand this record",
    question: "What do the current records support?",
    mode: "Explain",
    icon: Search,
  },
  {
    title: "See what needs review",
    question: "What is uncertain or missing before a decision?",
    mode: "Investigate",
    icon: Workflow,
  },
  {
    title: "Follow the connections",
    question: "Which records should I inspect next?",
    mode: "Explore",
    icon: Compass,
  },
] as const;
export function AskGridMind({ s, recordId }: { s: SampleWorkspace; recordId?: string }) {
  const [open, setOpen] = useState(false),
    [mode, setMode] = useState<AssistantMode>("Explain"),
    [question, setQuestion] = useState(""),
    [turns, setTurns] = useState<AssistantTurn[]>([]),
    [pending, setPending] = useState<string | null>(null),
    [notice, setNotice] = useState(""),
    [error, setError] = useState(""),
    [showContext, setShowContext] = useState(false),
    [showAbout, setShowAbout] = useState(false);
  const generation = useRef(0),
    locked = useRef(false),
    input = useRef<HTMLTextAreaElement>(null),
    title = useRef<HTMLHeadingElement>(null),
    transcript = useRef<HTMLDivElement>(null);
  const aboutId = useId();
  const contextId = useId(),
    contextKey = `${s.revision}/${recordId ?? "workspace"}`,
    previousContext = useRef(contextKey);
  const record = s.core.entities.find((e) => e.id === recordId),
    sampleCase = s.cases.find((c) => c.id === recordId),
    recordLabel =
      record?.label ??
      sampleCase?.title ??
      (recordId ? "Record unavailable" : "Organization overview");
  const missingContext = Boolean(recordId && !record && !sampleCase);
  const busy = pending !== null;
  function cancel(message = "Explanation cancelled. Your question remains in the composer.") {
    generation.current++;
    locked.current = false;
    setPending(null);
    setNotice(message);
  }
  function reset() {
    cancel("");
    setQuestion("");
    setMode("Explain");
    setTurns([]);
    setError("");
    input.current?.focus();
  }
  useEffect(() => {
    if (previousContext.current !== contextKey) {
      previousContext.current = contextKey;
      generation.current++;
      locked.current = false;
      setTurns([]);
      setPending(null);
      setError("");
      setNotice("Context changed. Start a new explanation from the current records.");
    }
  }, [contextKey]);
  useEffect(
    () => () => {
      generation.current++;
    },
    [],
  );
  useEffect(() => {
    if (open)
      transcript.current?.scrollTo({ top: transcript.current.scrollHeight, behavior: "auto" });
  }, [turns.length, busy, open]);
  useEffect(() => {
    if (showContext || showAbout) transcript.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [showContext, showAbout]);
  async function ask() {
    if (locked.current || !question.trim() || turns.length >= 6 || missingContext) return;
    locked.current = true;
    const id = ++generation.current,
      submitted = question,
      prompt = question.trim(),
      requestedMode = mode;
    setPending(prompt);
    setError("");
    setNotice("");
    try {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      if (id !== generation.current) return;
      const answer = explainSample(s, recordId, requestedMode, prompt);
      if (id === generation.current) {
        setTurns((previous) => [
          ...previous,
          {
            id: previous.length + 1,
            question: prompt,
            mode: requestedMode,
            answer,
            revision: s.sourceRevision,
          },
        ]);
        setQuestion((previous) => (previous === submitted ? "" : previous));
      }
    } catch (e) {
      if (id === generation.current)
        setError(
          e instanceof Error
            ? e.message
            : "Explanation unavailable. Try again with the current sample context.",
        );
    } finally {
      if (id === generation.current) {
        locked.current = false;
        setPending(null);
      }
    }
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) cancel("");
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">Ask GridMind</Button>
      </DialogTrigger>
      <DialogContent
        className="gm-ai-dialog"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          title.current?.focus();
        }}
      >
        <header className="gm-ai-header">
          <div className="gm-ai-brand">
            <img src={mark} width={34} height={34} alt="" />
            <div>
              <DialogTitle ref={title} tabIndex={-1}>
                Ask GridMind
              </DialogTitle>
              <p>Manufacturing context, made clear</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="gm-ai-reset gm-ai-icon-button"
            aria-label="Reset explanation"
            title="New conversation"
            onClick={reset}
          >
            <RotateCcw aria-hidden="true" />
          </Button>
        </header>
        <DialogDescription className="sr-only">
          Read-only deterministic sample explanation. SYNTHETIC data. Not generated by Claude.
          Questions summarize the selected context and mode; no paid API or private records are
          used.
        </DialogDescription>
        <div className="gm-ai-context-bar">
          <div>
            <span className="gm-ai-synthetic">
              <span aria-hidden="true" />
              SYNTHETIC
            </span>
            <span
              className="gm-ai-context-name"
              title={`${s.profile.organization} / ${s.profile.factory}`}
            >
              {s.profile.organization} / {s.profile.factory}
            </span>
          </div>
          <p title={recordId ?? "workspace"}>
            {recordLabel}
            <span className="num">rev {s.sourceRevision}</span>
          </p>
        </div>
        <div className="gm-ai-transcript" ref={transcript}>
          {showContext && (
            <section
              id={contextId}
              className="gm-ai-context-inspector"
              aria-label="Current assistant context"
            >
              <h3>Context for this explanation</h3>
              <dl>
                <div>
                  <dt>Organization</dt>
                  <dd>{s.profile.organization}</dd>
                </div>
                <div>
                  <dt>Factory</dt>
                  <dd>{s.profile.factory}</dd>
                </div>
                <div>
                  <dt>Record</dt>
                  <dd>
                    {recordLabel} <span className="num">({recordId ?? "workspace"})</span>
                  </dd>
                </div>
                <div>
                  <dt>Input</dt>
                  <dd>Revision {s.sourceRevision} · fixed historical replay</dd>
                </div>
              </dl>
              <p>
                Fictional session records only. No uploads, private data or operational commands.
              </p>
            </section>
          )}
          {showAbout && (
            <section
              id={aboutId}
              className="gm-ai-context-inspector"
              aria-label="Assistant capability"
            >
              <h3>How this assistant works</h3>
              <p>
                The deterministic fallback summarizes this record and mode. It does not answer
                arbitrary questions. Claude is not enabled: credentials, approved budget and server
                permission controls are still required.
              </p>
            </section>
          )}
          {missingContext && (
            <section className="gm-ai-context-inspector" role="status">
              <h3>Record unavailable</h3>
              <p>
                No record was loaded for this address. Close the assistant and open an available
                record from the sample workspace.
              </p>
            </section>
          )}
          {!turns.length && !busy && !missingContext && (
            <div className="gm-ai-welcome">
              <div className="gm-ai-welcome-mark">
                <Workflow aria-hidden="true" />
              </div>
              <p className="gm-ai-eyebrow">YOUR CONNECTED SAMPLE</p>
              <h2>
                Work through
                <br />
                the evidence.
              </h2>
              <p className="gm-ai-introduction">
                Understand this record, follow its connections, and see what still needs review.
              </p>
              <div className="gm-ai-starters">
                {starters.map((item) => (
                  <button
                    type="button"
                    key={item.mode}
                    onClick={() => {
                      setQuestion(item.question);
                      setMode(item.mode);
                      input.current?.focus();
                    }}
                  >
                    <item.icon aria-hidden="true" />
                    <span>{item.title}</span>
                    <ArrowUpRight aria-hidden="true" />
                  </button>
                ))}
              </div>
              <p className="gm-ai-welcome-note">
                <Check aria-hidden="true" />
                Read-only explanations. Your sample records stay unchanged.
              </p>
            </div>
          )}
          <div
            role="log"
            aria-label="Sample explanation conversation"
            aria-live="polite"
            aria-relevant="additions"
            aria-busy={busy}
          >
            {turns.map((turn) => (
              <AssistantMessage
                key={turn.id}
                turn={turn}
                s={s}
                onNotice={setNotice}
                onNavigate={() => setOpen(false)}
              />
            ))}
            {busy && (
              <div className="gm-ai-exchange">
                <div className="gm-ai-user">{pending}</div>
                <p className="gm-ai-preparing">Preparing the current record summary…</p>
              </div>
            )}
          </div>
        </div>
        <footer className="gm-ai-footer">
          {error && (
            <p className="gm-ai-error" role="alert">
              {error}
            </p>
          )}
          {notice && (
            <p className="gm-ai-notice" role="status">
              {notice}
            </p>
          )}
          <div className="gm-ai-engine-row">
            <button
              type="button"
              aria-expanded={showAbout}
              aria-controls={aboutId}
              onClick={() => setShowAbout((value) => !value)}
            >
              <Info aria-hidden="true" />
              Local sample
              <ChevronDown aria-hidden="true" />
            </button>
            <span>Review required</span>
          </div>
          <AssistantComposer
            question={question}
            setQuestion={setQuestion}
            mode={mode}
            setMode={setMode}
            busy={busy}
            limited={turns.length >= 6}
            unavailable={missingContext}
            inputRef={input}
            showContext={showContext}
            contextId={contextId}
            onContext={() => setShowContext((value) => !value)}
            onAsk={() => void ask()}
            onCancel={() => cancel()}
          />
        </footer>
      </DialogContent>
    </Dialog>
  );
}
