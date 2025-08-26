// Pure helpers to compute derived dashboard metrics

import type { Job } from "@/generated/prisma";

type Status = Job["status"];

export const isFinal = (j: Job) =>
  j.status === "offer" || j.status === "rejected";
export const isActive = (j: Job) => j.deletedAt === null;

export function activeOnly(all: Job[]) {
  return all.filter(isActive);
}

export function statusCountsActive(active: Job[]) {
  return active.reduce<Record<string, number>>((acc, j) => {
    if (!isFinal(j)) acc[j.status] = (acc[j.status] || 0) + 1;
    return acc;
  }, {});
}

export function startEndOfToday(now: Date = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function toDate(val: unknown): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  const d = new Date(val as any);
  return isNaN(d.getTime()) ? null : d;
}

export function countToday(all: Job[]) {
  const { start, end } = startEndOfToday();
  return all.filter((j) => {
    const d = toDate((j as any).createdAt);
    return d !== null && d >= start && d <= end;
  }).length;
}

export function countDecided(all: Job[]) {
  return all.filter(isFinal).length;
}

export function countWaitingActive(active: Job[]) {
  return active.filter((j) => j.status === "resume").length;
}
