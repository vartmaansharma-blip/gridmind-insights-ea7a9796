import { useRef } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useNavigationAccess } from "@/lib/navigation-context";
import { usePreferences } from "@/lib/preferences";
import { Button } from "@/components/ui/button";
import { resolveNavigation, GRIDMIND_AREAS } from "@/lib/navigation";
export function GlobalNavigation({ compact = false }: { compact?: boolean }) {
  const details = useRef<HTMLDetailsElement>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { access } = useNavigationAccess();
  const { preferences, update } = usePreferences();
  const destinations = resolveNavigation(access, pathname.startsWith("/explore"));
  return (
    <div
      className={
        compact
          ? "relative text-sm"
          : "relative z-40 flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-2 text-sm"
      }
    >
      {!compact && (
        <Link to="/" className="font-display font-semibold">
          GridMind{" "}
          <span className="text-muted-foreground font-normal">
            / {GRIDMIND_AREAS.find((a) => a.to === pathname)?.label ?? "Workspace"}
          </span>
        </Link>
      )}
      <details
        ref={details}
        className="group relative"
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            details.current?.removeAttribute("open");
            details.current?.querySelector("summary")?.focus();
          }
        }}
      >
        <summary
          className={
            compact
              ? "cursor-pointer rounded-md border border-border px-2 py-2 text-xs font-medium focus-visible:outline-2 focus-visible:outline-cta"
              : "cursor-pointer rounded-md border border-border px-3 py-2 font-medium focus-visible:outline-2 focus-visible:outline-cta"
          }
        >
          GridMind areas
        </summary>
        <nav
          aria-label="Global GridMind navigation"
          className="absolute right-0 top-full z-[80] mt-2 grid w-[min(20rem,calc(100vw-2rem))] rounded-lg border border-border bg-card p-2 text-card-foreground shadow-xl"
        >
          {destinations.map((a) => (
            <Link
              key={a.label}
              to={a.to}
              search={"search" in a ? a.search : undefined}
              params={"params" in a ? a.params : undefined}
              style={{ color: "inherit" }}
              aria-current={
                pathname === a.to || (a.label === "Explore" && pathname.startsWith("/explore/"))
                  ? "page"
                  : undefined
              }
              className="rounded p-2 hover:bg-accent hover:text-accent-foreground aria-[current=page]:bg-accent aria-[current=page]:text-accent-foreground"
              onClick={(e) => e.currentTarget.closest("details")?.removeAttribute("open")}
            >
              <span className="block font-medium">{a.label}</span>
              <span className="block text-xs opacity-75">{a.context}</span>
            </Link>
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={() => update({ sidebarCollapsed: !preferences.sidebarCollapsed })}
          >
            {preferences.sidebarCollapsed ? "Show workspace sidebar" : "Collapse workspace sidebar"}
          </Button>
        </nav>
      </details>
    </div>
  );
}
