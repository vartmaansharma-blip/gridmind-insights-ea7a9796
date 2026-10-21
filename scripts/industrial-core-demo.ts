import { runScenario } from "../src/lib/industrial-core/fixtures";
const id = process.argv[2] ?? "A";
if (!["A", "B", "C", "D"].includes(id)) throw new Error("Use synthetic scenario A, B, C or D");
console.log(JSON.stringify(runScenario(id as "A" | "B" | "C" | "D"), null, 2));
