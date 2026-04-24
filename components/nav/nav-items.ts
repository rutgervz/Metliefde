import { Inbox, Building2, Search, Settings } from "lucide-react";
import type { ComponentType } from "react";

export type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/entiteiten", label: "Entiteiten", icon: Building2 },
  { href: "/zoeken", label: "Zoeken", icon: Search },
  { href: "/instellingen", label: "Instellingen", icon: Settings },
];
