import { Fragment } from "react";
import { getRailNodes, RAIL_STAGES, type RailNode } from "@/lib/jobPipeline";
import { statusNodeClass } from "@/lib/jobStatusColors";

type Variant = "card" | "detail";

type Props = {
  status: string;
  /** Last open stage of a closed cycle (Job.cycleEndStage); ignored while the job is open. */
  cycleEndStage?: string | null;
  /**
   * `card`: compact rail inside a job card — 12px nodes, short labels, the five
   * open checkpoints (plus the outcome once the cycle is closed).
   * `detail`: the job page rail — 18px nodes, all six checkpoints, full labels from `sm`.
   */
  variant?: Variant;
  className?: string;
};

const REACHED = new Set<RailNode["state"]>(["done", "current", "offer", "rejected"]);

const STATE_TEXT: Record<RailNode["state"], string> = {
  done: "done",
  current: "current stage",
  upcoming: "not yet",
  notReached: "not reached",
  offer: "outcome",
  rejected: "outcome",
};

const SIZES = {
  card: {
    row: "h-6",
    // Offsets put a 2px line on the node row's center (24px row → 11px).
    lineTop: "top-[11px]",
    segTop: "mt-[11px]",
    node: "size-3",
    current: "size-4",
  },
  detail: {
    row: "h-7",
    lineTop: "top-[13px]",
    segTop: "mt-[13px]",
    node: "size-[18px]",
    current: "size-[22px]",
  },
} as const;

/**
 * "Interview 2" → "2" when another stage is the focus, so the labels fit a phone.
 * The card (five nodes) can afford "Interview 1" before any interview; the
 * six-node detail rail on a phone cannot, so it says "Int 1" there.
 */
function shortLabel(node: RailNode, nodes: RailNode[], variant: Variant): string {
  if (!node.key.startsWith("interview") || node.state === "current") return node.label;
  if (node.key === "interview1") {
    if (variant === "detail") return "Int 1";
    const currentInterview = nodes.some((n) => n.state === "current" && n.key.startsWith("interview"));
    if (!currentInterview) return node.label;
  }
  return node.key.slice(-1);
}

function nodeFill(node: RailNode): string {
  return statusNodeClass(node.key === "outcome" ? node.state : node.key);
}

/**
 * The Guided Rail: a 2px line with a node per checkpoint, nodes in their stage
 * color, the travelled part of the line darker, and a soft pulsing Signal halo
 * on the current stage. Semantics: an ordered list; the current item carries
 * `aria-current="step"` and every item announces its full label and state.
 */
export default function PipelineRail({
  status,
  cycleEndStage,
  variant = "detail",
  className = "",
}: Props) {
  const all = getRailNodes(status, cycleEndStage);
  const isClosed = status === "offer" || status === "rejected";
  // An open job's card shows the five checkpoints it can still travel.
  const nodes = variant === "card" && !isClosed ? all.slice(0, RAIL_STAGES.length) : all;
  const s = SIZES[variant];

  const travelled = (i: number) => i > 0 && REACHED.has(nodes[i].state) && REACHED.has(nodes[i - 1].state);
  const lineColor = (i: number) => (travelled(i) ? "bg-ink-muted" : "bg-ink-muted/25");

  return (
    <ol
      aria-label="Application pipeline"
      className={`grid items-start ${className}`}
      style={{
        // Each node column is as wide as its label (labels never overlap) but at
        // least a minimum width, so short labels like "2" do not bunch their nodes
        // together. Six detail nodes on a phone need the smaller minimum.
        gridTemplateColumns: nodes
          .map(() => `minmax(${variant === "card" ? "2.5rem" : "2rem"}, auto)`)
          .join(" minmax(6px, 1fr) "),
      }}
    >
      {nodes.map((node, i) => {
        const isCurrent = node.state === "current";
        const reached = REACHED.has(node.state);
        const short = shortLabel(node, nodes, variant);

        return (
          <Fragment key={node.key}>
            {i > 0 && (
              <li
                role="presentation"
                aria-hidden
                className={`${s.segTop} h-[2px] ${lineColor(i)}`}
              />
            )}
            <li
              aria-current={isCurrent ? "step" : undefined}
              className="relative flex flex-col items-center gap-1.5"
            >
              {/* Half-lines join the node to the segments on either side. */}
              {i > 0 && (
                <span aria-hidden className={`absolute left-0 right-1/2 ${s.lineTop} h-[2px] ${lineColor(i)}`} />
              )}
              {i < nodes.length - 1 && (
                <span aria-hidden className={`absolute left-1/2 right-0 ${s.lineTop} h-[2px] ${lineColor(i + 1)}`} />
              )}
              <span className={`relative z-[1] flex ${s.row} items-center justify-center`}>
                <span
                  aria-hidden
                  data-state={node.state}
                  className={`block rounded-full ${
                    isCurrent
                      ? `${s.current} rail-token ${nodeFill(node)}`
                      : reached
                        ? `${s.node} ${nodeFill(node)}`
                        : node.state === "notReached"
                          ? `${s.node} border-2 border-dashed border-ink-muted/50 bg-surface`
                          : `${s.node} border-2 border-ink-muted/50 bg-surface`
                  }`}
                />
              </span>
              <span
                className={`whitespace-nowrap text-xs leading-tight ${
                  isCurrent ? "font-semibold text-ink" : reached ? "text-ink" : "text-ink-muted"
                }`}
              >
                {variant === "card" ? (
                  <span aria-hidden>{short}</span>
                ) : (
                  <>
                    <span aria-hidden className="sm:hidden">{short}</span>
                    <span aria-hidden className="hidden sm:inline">{node.label}</span>
                  </>
                )}
                <span className="sr-only">
                  {node.label}, {STATE_TEXT[node.state]}
                </span>
              </span>
            </li>
          </Fragment>
        );
      })}
    </ol>
  );
}
