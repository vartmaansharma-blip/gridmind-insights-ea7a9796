# GridMind Insights

Build the first working MVP of a product called GridMind Factory Energy Intelligence.

Purpose: help industrial factories understand where they are losing money on electricity and identify actionable savings opportunities. This is a software-first MVP; do NOT build hardware integrations yet.

Build a polished, premium B2B industrial dashboard, not a generic SaaS template. The product should feel credible to factory owners/plant managers.

Core workflow:
1. Add/select a factory.
2. Enter or import sample factory data manually for MVP: monthly electricity consumption, electricity cost, peak demand, contract demand, production volume, operating hours, and major equipment.
3. Analyze the data.
4. Show the most important findings as Problem → likely cause → estimated ₹ impact → recommended action → expected saving.
5. Show savings verification with baseline, intervention, post-intervention and verified savings.

Pages/sections:
- Overview dashboard: monthly electricity cost, consumption, peak demand, production, energy/unit, estimated savings opportunity.
- Energy: monthly consumption/cost trends and demand trend.
- Opportunities: ranked actionable opportunities with rupee impact, confidence, status, and details.
- Alerts: abnormal consumption / demand patterns.
- Savings: before/after verification.
- Factory profile/data input.

Use realistic demo data for a fictional Adityapur auto-component factory so the product is immediately understandable. Clearly label demo data as demo data; never imply it is a real customer's data.

Important product principles:
- No meaningless charts.
- Every major insight must connect to money, capacity, reliability, or action.
- Use Indian rupee formatting.
- Make the main CTA obvious: Add Factory / Run Analysis.
- Include a guided empty-state for when no real data is connected.
- Include a simple data quality indicator.
- Make calculations deterministic and transparent.
- Do not claim actual savings unless marked as estimated/demo.
- Responsive mobile-first design.
- Premium industrial aesthetic: restrained, modern, high trust, subtle motion, excellent typography, rounded cards but not childish, strong hierarchy.

For the first MVP, prioritize working functionality over visual excess. Seed the demo factory with enough data to make the dashboard useful. Include a simple analysis engine in the frontend or local state that calculates energy/unit, cost trends, demand utilization, and opportunity estimates from entered data. Structure the code so real CSV/meter integrations can be added later.

Do not add payment, authentication, hardware, or external integrations yet. This is the validation MVP.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://gridmind-insights.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/12d7acd4-2c00-472a-9b77-af92553ef7dc).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
