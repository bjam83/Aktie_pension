"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NAV_ITEMS } from "./nav-items";
import { signOutAction } from "@/lib/actions/auth";
import { HOUSEHOLD_FILTER, PersonFilterProvider, usePersonFilter } from "./PersonFilterContext";
import type { Person } from "@/lib/types";

const MORE_ICON = "M12 6.5v.01M12 12v.01M12 17.5v.01";

function PersonFilterBar({ persons }: { persons: Person[] }) {
  const { personId, setPersonId } = usePersonFilter();
  if (persons.length <= 1) return null;

  return (
    <div className="flex flex-wrap gap-[8px] mt-[14px]" role="group" aria-label="Filtrér på person">
      <button type="button" className="chip" data-active={personId === HOUSEHOLD_FILTER} onClick={() => setPersonId(HOUSEHOLD_FILTER)}>
        Hele husstanden
      </button>
      {persons.map((p) => (
        <button key={p.id} type="button" className="chip" data-active={personId === p.id} onClick={() => setPersonId(p.id)}>
          {p.name}
        </button>
      ))}
    </div>
  );
}

export function Shell({
  householdName,
  persons,
  children,
}: {
  householdName: string;
  persons: Person[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const closeMore = () => setMoreOpen(false);

  const primaryItems = NAV_ITEMS.filter((i) => i.primary);
  const secondaryItems = NAV_ITEMS.filter((i) => !i.primary);
  const isSecondaryActive = secondaryItems.some((i) => i.href === pathname);

  return (
    <PersonFilterProvider>
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

        <PersonFilterBar persons={persons} />

        <nav className="tabnav mt-[22px] mb-[18px]">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} data-active={pathname === item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <main className="pb-16">{children}</main>
      </div>

      {moreOpen && <button className="bnav-backdrop" aria-label="Luk menu" onClick={() => setMoreOpen(false)} />}

      <nav className="bnav">
        {moreOpen && (
          <div className="bnav-sheet">
            {secondaryItems.map((item) => (
              <Link key={item.href} href={item.href} className="bnav-sheet-item" data-active={pathname === item.href} onClick={closeMore}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={item.icon} />
                </svg>
                {item.label}
              </Link>
            ))}
          </div>
        )}
        <div className="bnav-inner">
          {primaryItems.map((item) => (
            <Link key={item.href} href={item.href} className="bnav-btn" data-active={pathname === item.href} onClick={closeMore}>
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.icon} />
              </svg>
              {item.label}
            </Link>
          ))}
          <button className="bnav-btn" type="button" data-active={isSecondaryActive || moreOpen} onClick={() => setMoreOpen((v) => !v)}>
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <path d={MORE_ICON} />
            </svg>
            Mere
          </button>
        </div>
      </nav>
    </div>
    </PersonFilterProvider>
  );
}
