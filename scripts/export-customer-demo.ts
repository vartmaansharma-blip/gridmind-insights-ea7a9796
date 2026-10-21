import { writeFile } from "node:fs/promises";
import { customerDemo } from "../src/lib/industrial-core/customer-demo";

const sample = await customerDemo("A");
await writeFile(
  new URL("../data/industrial-core/customer-demo-A-SYNTHETIC.json", import.meta.url),
  JSON.stringify(sample, null, 2) + "\n",
);
console.log("Exported the fictional customer sample and actual computed decision.");
