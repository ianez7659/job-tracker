// Short encouragement shown under stage-based AI advice (edit job → Interview prep).

export const AI_ASSIST_CHEERING_BY_STAGE: Record<string, string> = {
  resume:
    "You made it past the gate—keep sharpening how you tell your impact and why this role fits you.",
  interview1:
    "First conversations are about clarity and curiosity. Trust your prep, listen well, and let your enthusiasm show.",
  interview2:
    "You’re deeper through the funnel—bring examples with outcomes, and show you’ve done your homework on the team.",
  interview3:
    "Final stretch. Stay calm, connect your experience to their outcomes, and leave them confident you can deliver.",
  applying:
    "One step at a time—tight application materials open the door to every conversation ahead.",
  offer:
    "You earned this moment—celebrate, then think through what you need to say yes with confidence.",
  rejected:
    "Every no refines your story. Take the learning, rest if you need to, then come back at the next one stronger.",
};

export function getAiAssistCheeringMessage(stage: string): string | null {
  const msg = AI_ASSIST_CHEERING_BY_STAGE[stage];
  return typeof msg === "string" && msg.length > 0 ? msg : null;
}
