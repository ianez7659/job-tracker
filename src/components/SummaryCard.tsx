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
}: {
  title: string;
  shortTitle?: string;
  value: number;
  color: string;
  textColor?: string;
  onClick?: () => void;
  icon?: ReactNode;
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
      {/* Mobile: stacked, centered. Desktop: number left, icon+title right */}
      <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:justify-between sm:text-left sm:gap-3">
        <p className={`text-md font-medium ${textColor}`}>
          <span className="inline-flex items-center justify-center gap-1 sm:justify-end">
            {icon ? (
              <span aria-hidden="true" className="shrink-0">
                {icon}
              </span>
            ) : null}
            <span className="block sm:hidden">{shortTitle ?? title}</span>
            <span className="hidden sm:block">{title}</span>
          </span>
        </p>
        <h2 className={`text-xl sm:text-4xl font-medium ${textColor}`}>
          {displayValue}
        </h2>
      </div>
    </div>
  );
}
