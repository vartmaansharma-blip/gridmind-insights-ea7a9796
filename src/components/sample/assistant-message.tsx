import { ChevronDown, Copy, FileText, ShieldAlert, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Explanation, AssistantMode } from "@/lib/assistant/explanation";
import type { SampleWorkspace } from "@/lib/sample/workspace";
import { RecordLink, EvidenceCard } from "./record-detail";
import mark from "@/assets/gridmind-mark.png";
export type AssistantTurn = {
  id: number;
  question: string;
  mode: AssistantMode;
  answer: Explanation;
  revision: number;
};
export function AssistantMessage({
  turn,
  s,
  onNotice,
  onNavigate,
}: {
  turn: AssistantTurn;
  s: SampleWorkspace;
  onNotice: (message: string) => void;
  onNavigate: () => void;
}) {
  const { answer } = turn;
  return (
    <section className="gm-ai-exchange" aria-label={`Explanation ${turn.id}`}>
      <div className="gm-ai-user">
        <span className="sr-only">Your question: </span>
        {turn.question}
      </div>
      <article className="gm-ai-answer">
        <div className="gm-ai-answer-byline">
          <img src={mark} width={26} height={26} alt="" />
          <strong>GridMind</strong>
          <span>{turn.mode} · sample explanation</span>
        </div>
        <h3 className="gm-ai-answer-heading">What the records support</h3>
        <p className="gm-ai-answer-text">
          {answer.answer.replaceAll("candidate_feasible", "candidate feasible")}
        </p>
        <div className="gm-ai-next">
          <ArrowUpRight aria-hidden="true" />
          <div>
            <strong>Next action</strong>
            <p>{answer.nextStep}</p>
          </div>
        </div>
        <p className="gm-ai-review">
          <ShieldAlert aria-hidden="true" />
          Human review required. No real operational authority.
        </p>
        <div className="gm-ai-answer-details">
          <details className="gm-ai-disclosure">
            <summary>
              <FileText aria-hidden="true" />
              Sources <span className="gm-ai-count">{answer.evidenceIds.length}</span>
              <ChevronDown aria-hidden="true" />
            </summary>
            <div className="gm-ai-source-list">
              {answer.evidenceIds.map((id) => (
                <EvidenceCard key={id} s={s} id={id} />
              ))}
            </div>
          </details>
          <details className="gm-ai-disclosure">
            <summary>
              Assumptions & uncertainty
              <ChevronDown aria-hidden="true" />
            </summary>
            <ul className="gm-ai-assumptions">
              {[...answer.assumptions, ...answer.uncertainty].map((text) => (
                <li key={text}>{text}</li>
              ))}
            </ul>
          </details>
        </div>
        {answer.recordIds.length > 0 && (
          <nav
            className="gm-ai-records"
            aria-label="Assistant related records"
            onClick={(event) => {
              if ((event.target as Element).closest("a")) onNavigate();
            }}
          >
            {answer.recordIds.map((id) => (
              <RecordLink key={id} s={s} id={id} />
            ))}
          </nav>
        )}
        <div className="gm-ai-answer-footer">
          <span>SYNTHETIC · input revision {turn.revision}</span>
          <Button
            variant="ghost"
            className="gm-ai-icon-button"
            aria-label="Copy synthetic explanation"
            title="Copy synthetic explanation"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(JSON.stringify(answer, null, 2));
                onNotice("Synthetic explanation copied.");
              } catch {
                onNotice("Clipboard unavailable. Select the explanation text to copy it.");
              }
            }}
          >
            <Copy aria-hidden="true" />
          </Button>
        </div>
      </article>
    </section>
  );
}
