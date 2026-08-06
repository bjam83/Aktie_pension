"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-items";
import { signOutAction } from "@/lib/actions/auth";

export function Shell({
  householdName,
  children,
}: {
  householdName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1120px] px-[22px] pt-7 app-main">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="eyebrow">{householdName || "Privatøkonomisk overblik"}</div>
            <h1 className="h1">Pension &amp; opsparing</h1>
          </div>
          <form action={signOutAction}>
            <button className="btn ghost tiny" type="submit">
              Log ud
            </button>
          </form>
        </div>

        <nav className="tabnav mt-[22px] mb-[18px]">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} data-active={pathname === item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <main className="pb-16">{children}</main>
      </div>

      <nav className="bnav">
        <div className="bnav-inner">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="bnav-btn" data-active={pathname === item.href}>
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.icon} />
              </svg>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
