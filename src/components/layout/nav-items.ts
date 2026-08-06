export interface NavItem {
  href: string;
  label: string;
  /** SVG path data for the mobile bottom-nav icon (24x24 viewbox, stroke-based). */
  icon: string;
  /** Shown directly in the mobile bottom nav. The rest live under "Mere" so the bar doesn't get cramped. */
  primary?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Overblik", icon: "M4 18h4v-8H4zm6 0h4V6h-4zm6 0h4V2h-4z", primary: true },
  { href: "/pension", label: "Pension", icon: "M3 17l4-5 4 4 4-6 5 4", primary: true },
  { href: "/investeringer", label: "Investeringer", icon: "M4 20V10m6 10V4m6 16v-7m6 7V8", primary: true },
  { href: "/budget", label: "Budget", icon: "M3 6h18M3 12h18M3 18h10", primary: true },
  { href: "/husstand", label: "Husstand", icon: "M4 21V10l8-6 8 6v11h-5v-6H9v6z" },
  { href: "/udbetaling", label: "Udbetaling", icon: "M12 3v9m0 0l-3-3m3 3l3-3M5 17h14l-1.5 4h-11z" },
  { href: "/frie-midler", label: "Frie midler", icon: "M12 21a9 9 0 100-18 9 9 0 000 18zm0-13v4l3 2" },
  { href: "/indstillinger", label: "Indstillinger", icon: "M12 15a3 3 0 100-6 3 3 0 000 6zm0-9v1.5M12 18v1.5M4.2 6.9l1 1.1M16.8 15.1l1 1M3 12H4.5M19.5 12H21M4.2 17.1l1.1-1M16.8 8.9l1-1.1" },
];
