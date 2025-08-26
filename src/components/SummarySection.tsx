import SummaryCard from "./SummaryCard";

type SummarySectionProps = {
  cards: {
    title: string;
    shortTitle?: string;
    value: number;
    color: string;
    textColor?: string;
    onClick?: () => void;
  }[];
  grid?: string;
  className?: string;
};

export default function SummarySection({
  cards,
  grid = "grid-cols-1 sm:grid-cols-2",
  className = "",
}: SummarySectionProps) {
  return (
    <div
      className={`grid ${grid} gap-4 ${className}`}
    >
      {cards.map((card, idx) => (
        <SummaryCard key={idx} {...card} />
      ))}
    </div>
  );
}
