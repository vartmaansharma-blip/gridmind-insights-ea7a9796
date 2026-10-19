import type { LinkProps } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Lightbulb,
  Inbox,
  Factory,
  Zap,
  Cpu,
  BadgeIndianRupee,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
export type DashboardNav = { to: LinkProps["to"]; label: string; icon: LucideIcon };
export const STAFF_NAV: DashboardNav[] = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/team/cases", label: "Investigations", icon: Lightbulb },
  { to: "/team/electricity", label: "Electricity cases", icon: Zap },
  { to: "/team/intake", label: "Intake", icon: Inbox },
  { to: "/factory", label: "Factory / Data", icon: Factory },
  { to: "/energy", label: "Energy", icon: Zap },
  { to: "/machines", label: "Machines", icon: Cpu },
  { to: "/opportunities", label: "Opportunities", icon: Lightbulb },
  { to: "/alerts", label: "Alerts", icon: AlertTriangle },
  { to: "/savings", label: "Savings", icon: BadgeIndianRupee },
];
export const CUSTOMER_NAV: DashboardNav[] = [
  { to: "/cases", label: "Your investigations", icon: LayoutDashboard },
];
