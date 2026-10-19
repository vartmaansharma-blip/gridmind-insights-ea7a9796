import { createFileRoute } from "@tanstack/react-router";
import { ElectricityDemonstration } from "@/components/public-site/electricity-demo";

/** Public fictional investigation: no API, credentials, or real customer data. */
export const Route = createFileRoute("/electricity-demo")({
  head: () => ({
    meta: [
      { title: "Electricity investigation walkthrough — GridMind" },
      { name: "description", content: "Explore a fictional industrial electricity bill investigation. Trace recorded demand, test an invented explanation and see what requires qualified review. No real customer data or savings claims." },
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: "Why was 400 kVA billed? — GridMind (fictional demonstration)" },
      { property: "og:description", content: "An interactive fictional evidence-led electricity investigation. No real bill, tariff determination or savings claim." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ElectricityDemonstration,
});
