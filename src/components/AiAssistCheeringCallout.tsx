import { Sparkles } from "lucide-react";
import { getAiAssistCheeringMessage } from "@/lib/constants/aiAssistCheering";

type Props = {
  stage: string;
};

// Renders a compact encouragement line under AI stage advice when a message exists for the pipeline stage.
export function AiAssistCheeringCallout({ stage }: Props) {
  const message = getAiAssistCheeringMessage(stage);
  if (!message) return null;

  return (
    <div
      className="mt-3 rounded-md border border-amber-200/90 dark:border-amber-600/40 bg-amber-50/95 dark:bg-amber-950/35 px-3 py-2.5 shrink-0"
      role="note"
      aria-label="Encouragement"
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200/95 mb-1 flex items-center gap-1.5">
        <Sparkles className="size-3.5 shrink-0 opacity-90" aria-hidden />
        You&apos;ve got this
      </p>
      <p className="text-xs text-amber-950/95 dark:text-amber-50/90 leading-snug">
        {message}
      </p>
    </div>
  );
}
