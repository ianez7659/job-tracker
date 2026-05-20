// Admin domain types — no DB schema dependency, derived from query results

export type UserStatus = "active" | "at_risk" | "hired";

export interface AdminOverview {
  currentlyActiveUsers: number;     // last 3 days DAILY_ACTIVITY
  totalStudents: number;            // hubStatus STUDENT or ALUMNI (non-STAFF, non-null category)
  hiredCount: number;               // users with at least one offer job
  hiredRate: number;                // hiredCount / totalStudents (0–1)
  stuckApplicationsCount: number;   // jobs stuck in applying/resume 14+ days
  needsSupportCount: number;        // 14+ days no activity OR 0 jobs
  categoryDistribution: CategoryCount[];
}

export interface CategoryCount {
  category: string;   // USER_CATEGORIES value or "not_set"
  label: string;
  count: number;
}

export interface RankedUser {
  id: string;
  name: string | null;
  email: string;
  category: string | null;
  totalXp: number;
  currentLevel: number;
  lastActiveAt: Date | null;
  loginStreak: number;
}

export interface StuckApplication {
  jobId: string;
  title: string;
  company: string;
  status: string;
  appliedAt: Date;
  daysSinceApplied: number;
  userId: string;
  userName: string | null;
  userEmail: string;
}

export interface SupportUser {
  id: string;
  name: string | null;
  email: string;
  category: string | null;
  jobCount: number;
  lastActiveAt: Date | null;
  daysSinceActive: number | null;
  reason: "no_jobs" | "inactive";
}

export type HubStatus = "STUDENT" | "ALUMNI" | "STAFF" | null;

export interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  hubStatus: HubStatus;
  category: string | null;
  createdAt: Date;
  jobCount: number;
}
