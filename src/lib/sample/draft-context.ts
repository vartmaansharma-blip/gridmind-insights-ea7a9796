import { createContext, useContext } from "react";
export const Drafts = createContext<Map<string, [string, string][]> | null>(null);
export const useSampleDrafts = () => useContext(Drafts);
