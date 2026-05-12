import { buildShuffledSnapshot, fisherYatesShuffle } from "./choiceShuffler";

const CHOICES = [
  { id: "a", text: "Option A" },
  { id: "b", text: "Option B" },
  { id: "c", text: "Option C" },
  { id: "d", text: "Option D" },
];

// Deterministic pseudo-random: always returns 0, so each swap is [i,0]
const alwaysZero = () => 0;
// Deterministic pseudo-random: always returns 0.99, so no actual swap
const alwaysMax = () => 0.9999;

describe("fisherYatesShuffle", () => {
  it("returns same length array", () => {
    const result = fisherYatesShuffle([...CHOICES]);
    expect(result).toHaveLength(CHOICES.length);
  });

  it("contains same elements after shuffle", () => {
    const result = fisherYatesShuffle([...CHOICES]);
    const ids = result.map((c) => c.id).sort();
    expect(ids).toEqual(["a", "b", "c", "d"]);
  });

  it("is deterministic with seeded random", () => {
    const run1 = fisherYatesShuffle([...CHOICES], alwaysZero);
    const run2 = fisherYatesShuffle([...CHOICES], alwaysZero);
    expect(run1.map((c) => c.id)).toEqual(run2.map((c) => c.id));
  });

  it("does not mutate the original array when called with a copy", () => {
    const original = [...CHOICES];
    const copy = [...CHOICES];
    fisherYatesShuffle(copy, alwaysZero);
    expect(original.map((c) => c.id)).toEqual(["a", "b", "c", "d"]);
  });
});

describe("buildShuffledSnapshot", () => {
  it("returns all required snapshot fields", () => {
    const snapshot = buildShuffledSnapshot(CHOICES, "b");
    expect(snapshot).toHaveProperty("choicesSnapshot");
    expect(snapshot).toHaveProperty("correctChoiceIdSnapshot", "b");
    expect(snapshot).toHaveProperty("correctIndexSnapshot");
  });

  it("choicesSnapshot contains exactly the original choices", () => {
    const snapshot = buildShuffledSnapshot(CHOICES, "a");
    const ids = snapshot.choicesSnapshot.map((c) => c.id).sort();
    expect(ids).toEqual(["a", "b", "c", "d"]);
  });

  it("correctIndexSnapshot points to correctChoiceId in shuffled array", () => {
    const snapshot = buildShuffledSnapshot(CHOICES, "c");
    const { choicesSnapshot, correctIndexSnapshot, correctChoiceIdSnapshot } = snapshot;
    expect(choicesSnapshot[correctIndexSnapshot].id).toBe(correctChoiceIdSnapshot);
    expect(correctChoiceIdSnapshot).toBe("c");
  });

  it("correctIndexSnapshot is accurate with seeded random (alwaysZero)", () => {
    const snapshot = buildShuffledSnapshot(CHOICES, "d", alwaysZero);
    expect(snapshot.choicesSnapshot[snapshot.correctIndexSnapshot].id).toBe("d");
  });

  it("correctIndexSnapshot is accurate with seeded random (alwaysMax)", () => {
    const snapshot = buildShuffledSnapshot(CHOICES, "a", alwaysMax);
    expect(snapshot.choicesSnapshot[snapshot.correctIndexSnapshot].id).toBe("a");
  });

  it("throws if correctChoiceId is not in choices", () => {
    expect(() => buildShuffledSnapshot(CHOICES, "z")).toThrow(
      /correctChoiceId "z" not found/,
    );
  });

  it("throws if choices array is empty", () => {
    expect(() => buildShuffledSnapshot([], "a")).toThrow(/choices array is empty/);
  });

  it("correctIndexSnapshot stays within valid range", () => {
    for (let seed = 0; seed < 20; seed++) {
      let calls = 0;
      const seededRandom = () => {
        calls++;
        return (calls * 0.17 + seed * 0.13) % 1;
      };
      const snapshot = buildShuffledSnapshot(CHOICES, "b", seededRandom);
      expect(snapshot.correctIndexSnapshot).toBeGreaterThanOrEqual(0);
      expect(snapshot.correctIndexSnapshot).toBeLessThan(CHOICES.length);
    }
  });
});
