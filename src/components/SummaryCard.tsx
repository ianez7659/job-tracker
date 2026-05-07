"use client";

import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useMotionValue, useMotionValueEvent, animate } from "framer-motion";

export default function SummaryCard({
  title,
  shortTitle,
  value,
  color,
  textColor = "text-gray-800",
  onClick,
  icon,
  variant = "default",
}: {
  title: string;
  shortTitle?: string;
  value: number;
  color: string;
  textColor?: string;
  onClick?: () => void;
  icon?: ReactNode;
  variant?: "default" | "compact";
}) {
  const isClickable = typeof onClick === "function";
  const motionValue = useMotionValue(0);
  const [displayValue, setDisplayValue] = useState(0);

  useMotionValueEvent(motionValue, "change", (v) => {
    setDisplayValue(Math.round(v));
  });

  useEffect(() => {
    const controls = animate(motionValue, value, {
      type: "tween",
      duration: 1.0,
      ease: [0.25, 0.1, 0.35, 1],
    });
    return () => controls.stop();
  }, [value, motionValue]);

  const isCompact = variant === "compact";
  const padClass = isCompact ? "p-1.5 sm:p-3" : "p-4";
  const layoutClass = isCompact
    ? "flex flex-col items-center justify-center gap-0.5 min-w-0 text-center w-full"
    : "flex flex-col items-center text-center sm:flex-row sm:items-center sm:justify-between sm:text-left sm:gap-3";
  const titleClass = isCompact
    ? "text-sm leading-tight sm:text-lg font-medium"
    : "text-md font-medium";
  const valueClass = isCompact
    ? "text-base sm:text-2xl font-semibold tabular-nums leading-none"
    : "text-xl sm:text-4xl font-medium";

  return (
    <div
      className={`rounded-lg shadow-sm ${padClass} ${color} ${
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
      <div className={layoutClass}>
        <p className={`${titleClass} ${textColor} min-w-0`}>
          <span
            className={`inline-flex items-center gap-0.5 min-w-0 ${
              isCompact ? "justify-center" : "justify-center sm:justify-end"
            }`}
          >
            {icon ? (
              <span
                aria-hidden="true"
                className={
                  isCompact
                    ? "shrink-0 [&_svg]:size-3.5 sm:[&_svg]:size-[18px]"
                    : "shrink-0"
                }
              >
                {icon}
              </span>
            ) : null}
            {isCompact ? (
              <span className="truncate">{shortTitle ?? title}</span>
            ) : (
              <>
                <span className="block sm:hidden">{shortTitle ?? title}</span>
                <span className="hidden sm:block">{title}</span>
              </>
            )}
          </span>
        </p>
        <h2 className={`${valueClass} ${textColor}`}>{displayValue}</h2>
      </div>
    </div>
  );
}
