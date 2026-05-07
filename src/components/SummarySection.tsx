import type { ReactNode } from "react";
import SummaryCard from "./SummaryCard";

type SummarySectionProps = {
  cards: {
    title: string;
    shortTitle?: string;
    value: number;
    color: string;
    textColor?: string;
    onClick?: () => void;
    icon?: ReactNode;
  }[];
  grid?: string;
  className?: string;
  cardVariant?: "default" | "compact";
};

export default function SummarySection({
  cards,
  grid = "grid-cols-1 sm:grid-cols-2 gap-4",
  className = "",
  cardVariant = "default",
}: SummarySectionProps) {
  return (
    <div className={`grid ${grid} ${className}`}>
      {cards.map((card, idx) => (
        <SummaryCard key={idx} {...card} variant={cardVariant} />
      ))}
    </div>
  );
}
