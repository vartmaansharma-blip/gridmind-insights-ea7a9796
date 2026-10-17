import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Lightbulb,
  Inbox,
  Factory,
  Zap,
  Cpu,
  BadgeIndianRupee,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";
import type { DashboardNav } from "./dashboard-nav";
import gridMindMark from "@/assets/gridmind-mark.png";
export function DashboardBrand() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <img src={gridMindMark} alt="" width={36} height={36} className="size-9 object-contain" />
      <span className="leading-tight">
        <span className="block text-sm font-semibold">GridMind</span>
        <span className="block text-[9px] uppercase tracking-[0.14em] opacity-60">
          Infrastructure intelligence
        </span>
      </span>
    </Link>
  );
}
export function DashboardFrame({
  children,
  header,
  links,
  footer,
  floating,
  sidebarFooter,
}: {
  children: ReactNode;
  header: ReactNode;
  links: readonly DashboardNav[];
  footer?: ReactNode;
  floating?: ReactNode;
  sidebarFooter?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background lg:pl-64">
      <a
        href="#workspace-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-card focus:p-3"
      >
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-rail p-4 text-rail-foreground lg:flex">
        <DashboardBrand />
        <nav aria-label="Workspace navigation" className="mt-8 grid gap-0.5">
          {links.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.to === "/" }}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-rail-muted transition-colors hover:bg-rail-active hover:text-rail-foreground"
              activeProps={{ className: "bg-rail-active !text-rail-foreground font-medium" }}
            >
              <n.icon className="size-4" />
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-sidebar-border pt-4 text-xs leading-5 text-rail-muted">
          {sidebarFooter ?? (
            <>
              <p className="font-semibold text-rail-foreground">Evidence. Clarity. Decisions.</p>
              <p>Every conclusion has a source. Every next step has an owner.</p>
              <Link to="/" className="mt-3 inline-flex items-center gap-1">
                About GridMind <ArrowUpRight className="size-3" />
              </Link>
            </>
          )}
        </div>
      </aside>
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        {header}
      </header>
      <main
        id="workspace-content"
        className="mx-auto max-w-[1440px] px-4 pb-28 pt-6 sm:px-6 lg:pb-12 lg:pt-8"
      >
        {children}
      </main>
      {floating}
      <nav
        aria-label="Mobile workspace navigation"
        className="fixed inset-x-0 bottom-0 z-30 flex overflow-x-auto border-t border-sidebar-border bg-rail lg:hidden"
      >
        {links.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            activeOptions={{ exact: n.to === "/" }}
            className="flex min-w-[82px] flex-1 flex-col items-center gap-1 px-2 py-3 text-[10px] text-rail-muted"
            activeProps={{ className: "!text-cta" }}
          >
            <n.icon className="size-5" />
            {n.label.split(" ")[0]}
          </Link>
        ))}
      </nav>
      {footer}
    </div>
  );
}
