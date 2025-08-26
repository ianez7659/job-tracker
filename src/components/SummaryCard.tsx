"use client";

import type { ReactNode } from "react";

export default function SummaryCard({
  title,
  shortTitle,
  value,
  color,
  textColor = "text-gray-800",
  onClick,
  icon,
}: {
  title: string;
  shortTitle?: string;
  value: number;
  color: string;
  textColor?: string;
  onClick?: () => void;
  icon?: ReactNode;
}) {
  // Add button-like semantics for better accessibility
  const isClickable = typeof onClick === "function";

  return (
    <div
      className={`rounded-lg shadow-sm p-4 ${color} ${
        isClickable ? "cursor-pointer" : ""
      }`}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : -1}
      onClick={onClick}
      onKeyDown={(e) => {
        if (!isClickable) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <p
        className={`text-md sm:text-lg text-center font-semibold ${textColor}`}
      >
        {/* Mobile shows shortTitle, desktop shows full title */}
        <span className="inline-flex items-center justify-center gap-1">
          {icon ? (
            <span aria-hidden="true" className="shrink-0">
              {icon}
            </span>
          ) : null}
          <span className="block sm:hidden">{shortTitle ?? title}</span>
          <span className="hidden sm:block">{title}</span>
        </span>
      </p>
      <h2 className={`text-md sm:text-xl text-center font-medium ${textColor}`}>
        {value}
      </h2>
    </div>
  );
}
