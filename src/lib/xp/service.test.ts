/**
 * @jest-environment node
 */

// Mock prisma before any imports
jest.mock("@/lib/prisma", () => ({
  prisma: {
    userXp: {
      upsert: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    xpEvent: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

import { prisma } from "@/lib/prisma";
import {
  awardForJobCreation,
  awardForCycleCompletion,
  awardDailyActivity,
  awardWeeklyReview,
} from "./service";
import { getDailyPeriodKey } from "./dailyPeriod";

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

// Helpers
const makeUserXp = (
  overrides?: Partial<{
    id: string;
    totalXp: number;
    lastDailyAt: Date | null;
    dailyTimeZone: string | null;
    lastDailyPeriodKey: string | null;
  }>,
) => ({
  id: "uxp-1",
  userId: "user-1",
  totalXp: 0,
  currentLevel: 1,
  lastDailyAt: null,
  dailyTimeZone: null,
  lastDailyPeriodKey: null,
  ...overrides,
});

const makeJob = (overrides?: object) => ({
  id: "job-1",
  company: "Acme",
  title: "Engineer",
  status: "applying",
  appliedAt: new Date("2024-01-01"),
  url: "https://example.com",
  jd: null,
  cycleEndStage: null,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.useRealTimers();
  // Default: $transaction executes all items
  (mockPrisma.$transaction as jest.Mock).mockImplementation(
    async (ops: unknown[]) => Promise.all((ops as unknown[]).map(() => Promise.resolve())),
  );
  (mockPrisma.userXp.findUnique as jest.Mock).mockResolvedValue(makeUserXp());
});

// ── awardForJobCreation ───────────────────────────────────────────────────────

describe("awardForJobCreation", () => {
  it("creates JOB_CREATED XpEvent and increments totalXp", async () => {
    (mockPrisma.userXp.upsert as jest.Mock).mockResolvedValue(makeUserXp());
    (mockPrisma.xpEvent.findFirst as jest.Mock).mockResolvedValue(null); // not yet awarded

    await awardForJobCreation("user-1", makeJob());

    expect(mockPrisma.$transaction).toHaveBeenCalled();
  });

  it("is idempotent — skips if JOB_CREATED already logged for this jobId", async () => {
    (mockPrisma.userXp.upsert as jest.Mock).mockResolvedValue(makeUserXp());
    (mockPrisma.xpEvent.findFirst as jest.Mock).mockResolvedValue({ id: "existing-event" });

    await awardForJobCreation("user-1", makeJob());

    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it("also awards daily activity when never claimed in current period", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-05-10T12:00:00.000Z"));
    (mockPrisma.userXp.upsert as jest.Mock).mockResolvedValue(
      makeUserXp({ lastDailyAt: null, lastDailyPeriodKey: null }),
    );
    (mockPrisma.xpEvent.findFirst as jest.Mock).mockResolvedValue(null);
    (mockPrisma.userXp.findUnique as jest.Mock).mockResolvedValue(
      makeUserXp({ lastDailyAt: null, lastDailyPeriodKey: null }),
    );

    await awardForJobCreation("user-1", makeJob());

    // $transaction called twice: once for job grants, once for daily
    expect((mockPrisma.$transaction as jest.Mock).mock.calls.length).toBe(2);
    jest.useRealTimers();
  });

  it("does NOT award daily when already awarded for same period (UTC)", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-05-10T12:00:00.000Z"));
    const periodKey = getDailyPeriodKey(new Date(), "UTC");
    (mockPrisma.userXp.upsert as jest.Mock).mockResolvedValue(
      makeUserXp({
        lastDailyPeriodKey: periodKey,
        lastDailyAt: new Date("2026-05-10T08:00:00.000Z"),
      }),
    );
    (mockPrisma.xpEvent.findFirst as jest.Mock).mockResolvedValue(null);
    (mockPrisma.userXp.findUnique as jest.Mock).mockResolvedValue(
      makeUserXp({
        lastDailyPeriodKey: periodKey,
        lastDailyAt: new Date("2026-05-10T08:00:00.000Z"),
      }),
    );

    await awardForJobCreation("user-1", makeJob());

    expect((mockPrisma.$transaction as jest.Mock).mock.calls.length).toBe(1);
    jest.useRealTimers();
  });

  it("does not throw when prisma fails — logs error instead", async () => {
    (mockPrisma.userXp.upsert as jest.Mock).mockRejectedValue(new Error("DB error"));
    await expect(awardForJobCreation("user-1", makeJob())).resolves.toBeUndefined();
  });
});

// ── awardForCycleCompletion ───────────────────────────────────────────────────

describe("awardForCycleCompletion", () => {
  it("creates CYCLE_COMPLETED XpEvent for a rejected job", async () => {
    (mockPrisma.userXp.upsert as jest.Mock).mockResolvedValue(makeUserXp());
    (mockPrisma.xpEvent.findFirst as jest.Mock).mockResolvedValue(null);

    await awardForCycleCompletion(
      "user-1",
      makeJob({ status: "rejected", cycleEndStage: "resume" }),
    );

    expect(mockPrisma.$transaction).toHaveBeenCalled();
  });

  it("is idempotent — skips if CYCLE_COMPLETED already logged for this jobId", async () => {
    (mockPrisma.userXp.upsert as jest.Mock).mockResolvedValue(makeUserXp());
    (mockPrisma.xpEvent.findFirst as jest.Mock).mockResolvedValue({ id: "existing-cycle" });

    await awardForCycleCompletion(
      "user-1",
      makeJob({ status: "rejected" }),
    );

    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it("does not throw on DB failure", async () => {
    (mockPrisma.userXp.upsert as jest.Mock).mockRejectedValue(new Error("DB error"));
    await expect(
      awardForCycleCompletion("user-1", makeJob({ status: "rejected" })),
    ).resolves.toBeUndefined();
  });
});

// ── awardDailyActivity ────────────────────────────────────────────────────────

describe("awardDailyActivity", () => {
  it("awards daily when never claimed in period", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-05-10T12:00:00.000Z"));
    (mockPrisma.userXp.upsert as jest.Mock).mockResolvedValue(
      makeUserXp({ lastDailyAt: null, lastDailyPeriodKey: null }),
    );
    (mockPrisma.userXp.findUnique as jest.Mock).mockResolvedValue(
      makeUserXp({ lastDailyAt: null, lastDailyPeriodKey: null }),
    );

    await awardDailyActivity("user-1");

    expect(mockPrisma.$transaction).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it("skips daily when already in same period", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-05-10T12:00:00.000Z"));
    const periodKey = getDailyPeriodKey(new Date(), "UTC");
    (mockPrisma.userXp.upsert as jest.Mock).mockResolvedValue(
      makeUserXp({ lastDailyPeriodKey: periodKey, lastDailyAt: new Date() }),
    );
    (mockPrisma.userXp.findUnique as jest.Mock).mockResolvedValue(
      makeUserXp({ lastDailyPeriodKey: periodKey, lastDailyAt: new Date() }),
    );

    await awardDailyActivity("user-1");

    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    jest.useRealTimers();
  });
});

// ── awardWeeklyReview ─────────────────────────────────────────────────────────

describe("awardWeeklyReview", () => {
  it("awards weekly review when no recent event exists", async () => {
    (mockPrisma.userXp.upsert as jest.Mock).mockResolvedValue(makeUserXp());
    (mockPrisma.xpEvent.findFirst as jest.Mock).mockResolvedValue(null);

    const result = await awardWeeklyReview("user-1");

    expect(result.awarded).toBe(true);
    expect(mockPrisma.$transaction).toHaveBeenCalled();
  });

  it("skips if WEEKLY_REVIEW already logged within last 7 days", async () => {
    (mockPrisma.userXp.upsert as jest.Mock).mockResolvedValue(makeUserXp());
    (mockPrisma.xpEvent.findFirst as jest.Mock).mockResolvedValue({ id: "existing-weekly" });

    const result = await awardWeeklyReview("user-1");

    expect(result.awarded).toBe(false);
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it("returns awarded: false on DB failure", async () => {
    (mockPrisma.userXp.upsert as jest.Mock).mockRejectedValue(new Error("DB error"));
    const result = await awardWeeklyReview("user-1");
    expect(result.awarded).toBe(false);
  });
});
