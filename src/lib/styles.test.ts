import {
  inputBase,
  selectBase,
  labelBase,
  headingBase,
  buttonBase,
  helperText,
} from "./styles";
import { btnPrimary } from "@/components/landing/buttonStyles";

const RAW_PALETTE = /\b(?:gray|slate|blue|yellow|indigo)-\d{2,3}\b|text-black|bg-white/;

describe("shared app styles use semantic tokens", () => {
  it.each([
    ["inputBase", inputBase],
    ["selectBase", selectBase],
    ["labelBase", labelBase],
    ["headingBase", headingBase],
    ["buttonBase", buttonBase],
    ["helperText", helperText],
    ["btnPrimary", btnPrimary],
  ])("%s carries no raw palette classes", (_name, classes) => {
    expect(classes).not.toMatch(RAW_PALETTE);
  });

  it("fields use hairline border, surface fill and a Signal focus ring in both themes", () => {
    for (const field of [inputBase, selectBase]) {
      expect(field).toContain("border-line");
      expect(field).toContain("bg-surface");
      expect(field).toContain("text-ink");
      expect(field).toContain("focus:ring-signal");
      expect(field).not.toMatch(/dark:/);
    }
  });

  it("solid buttons fill with signal-solid and deepen on hover", () => {
    for (const button of [buttonBase, btnPrimary]) {
      expect(button).toContain("bg-signal-solid");
      expect(button).toContain("hover:bg-signal-deep");
      expect(button).toContain("text-white");
    }
  });

  it("text styles use ink tokens", () => {
    expect(labelBase).toContain("text-ink");
    expect(headingBase).toContain("text-ink");
    expect(helperText).toContain("text-ink-muted");
  });
});
