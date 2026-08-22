import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Name / subtext / value / chevron row — the redesign's replacement for card
 * grids and shortcut buttons. Min 52px tall per the design spec's touch-target
 * rule. Renders as a link when `href` is given, otherwise a button.
 */
export function ListRow({
  href,
  onClick,
  label,
  subtext,
  value,
  valueColor,
  icon,
}: {
  href?: string;
  onClick?: () => void;
  label: string;
  subtext?: string;
  value?: string;
  valueColor?: string;
  icon?: ReactNode;
}) {
  const content = (
    <>
      {icon && <span className="lrow-icon">{icon}</span>}
      <span className="lrow-main">
        <span className="lrow-label">{label}</span>
        {subtext && <span className="lrow-sub">{subtext}</span>}
      </span>
      {value && (
        <span className="lrow-value" style={valueColor ? { color: valueColor } : undefined}>
          {value}
        </span>
      )}
      <svg className="lrow-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 6l6 6-6 6" />
      </svg>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="lrow">
        {content}
      </Link>
    );
  }
  return (
    <button type="button" className="lrow" onClick={onClick}>
      {content}
    </button>
  );
}
