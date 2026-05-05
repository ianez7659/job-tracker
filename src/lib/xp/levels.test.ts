import { computeLevel, xpRequiredForLevel } from "./levels";

describe("xpRequiredForLevel", () => {
  it("returns correct threshold for fixed levels", () => {
    expect(xpRequiredForLevel(1)).toBe(100);
    expect(xpRequiredForLevel(2)).toBe(150);
    expect(xpRequiredForLevel(3)).toBe(220);
    expect(xpRequiredForLevel(4)).toBe(300);
  });

  it("follows +100 pattern from level 5 onwards", () => {
    expect(xpRequiredForLevel(5)).toBe(400);
    expect(xpRequiredForLevel(6)).toBe(500);
    expect(xpRequiredForLevel(7)).toBe(600);
  });
});

describe("computeLevel", () => {
  it("returns level 1 with 0 XP", () => {
    const info = computeLevel(0);
    expect(info.level).toBe(1);
    expect(info.currentLevelXp).toBe(0);
    expect(info.xpToNextLevel).toBe(100);
    expect(info.progress).toBe(0);
  });

  it("returns level 1 midway through", () => {
    const info = computeLevel(50);
    expect(info.level).toBe(1);
    expect(info.currentLevelXp).toBe(50);
    expect(info.xpToNextLevel).toBe(100);
    expect(info.progress).toBeCloseTo(0.5);
  });

  it("advances to level 2 at exactly 100 XP", () => {
    const info = computeLevel(100);
    expect(info.level).toBe(2);
    expect(info.currentLevelXp).toBe(0);
    expect(info.xpToNextLevel).toBe(150);
  });

  it("advances to level 3 at 250 XP (100+150)", () => {
    const info = computeLevel(250);
    expect(info.level).toBe(3);
    expect(info.currentLevelXp).toBe(0);
    expect(info.xpToNextLevel).toBe(220);
  });

  it("advances to level 4 at 470 XP (100+150+220)", () => {
    const info = computeLevel(470);
    expect(info.level).toBe(4);
    expect(info.currentLevelXp).toBe(0);
  });

  it("advances to level 5 at 770 XP (100+150+220+300)", () => {
    const info = computeLevel(770);
    expect(info.level).toBe(5);
    expect(info.currentLevelXp).toBe(0);
    expect(info.xpToNextLevel).toBe(400);
  });

  it("handles level 6 correctly", () => {
    const info = computeLevel(770 + 400); // 1170 XP
    expect(info.level).toBe(6);
    expect(info.currentLevelXp).toBe(0);
    expect(info.xpToNextLevel).toBe(500);
  });

  it("clamps negative XP to level 1", () => {
    const info = computeLevel(-50);
    expect(info.level).toBe(1);
    expect(info.currentLevelXp).toBe(0);
  });

  it("progress is between 0 and 1", () => {
    const info = computeLevel(130); // level 2, 30/150 in
    expect(info.level).toBe(2);
    expect(info.progress).toBeGreaterThan(0);
    expect(info.progress).toBeLessThan(1);
  });
});
