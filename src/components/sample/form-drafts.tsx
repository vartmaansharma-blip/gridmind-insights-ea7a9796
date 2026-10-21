import { useRef, type ReactNode } from "react";
/** Session-only fictional form drafts. Never stores account data or survives leaving Explore. */
import { Drafts } from "@/lib/sample/draft-context";
export function SampleDraftProvider({ children }: { children: ReactNode }) {
  const drafts = useRef(new Map<string, [string, string][]>());
  return <Drafts.Provider value={drafts.current}>{children}</Drafts.Provider>;
}
