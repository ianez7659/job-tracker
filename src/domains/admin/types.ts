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

// ── Detailed user for /admin/users expanded table ────────────────────────────

export type EmploymentStatus = "hired" | "active" | "inactive";

export interface DetailedAdminUser {
  id: string;
  name: string | null;
  email: string;
  hubStatus: HubStatus;
  category: string | null;
  createdAt: Date;
  employmentStatus: EmploymentStatus;
  // job counts by status
  jobCounts: {
    total: number;
    applying: number;
    waiting: number;       // resume status
    interview: number;     // interview1/2/3 combined
    rejected: number;
    offered: number;
  };
  // XP / engagement
  totalXp: number;
  currentLevel: number;
  loginStreak: number;
  lastActiveAt: Date | null;
}

// ── Application for /admin/applications table ─────────────────────────────────

export interface AdminApplication {
  jobId: string;
  title: string;
  company: string;
  status: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  userCategory: string | null;
  appliedAt: Date;
  updatedAt: Date;
  hasUrl: boolean;
  hasJd: boolean;
  hasNotes: boolean;
}

// ── Analytics for /admin/analytics ───────────────────────────────────────────

export interface AdminAnalytics {
  usersByTrack: { label: string; count: number }[];
  applicationsByStatus: { status: string; count: number }[];
  hiredRate: number;
  hiredCount: number;
  totalStudents: number;
  userSegments: {
    active: number;
    hired: number;
    inactive: number;
  };
  interviewRate: number; // users who reached interview / total non-hired
}

// ── Rankings for /admin/rankings ──────────────────────────────────────────────

export interface AdminRankings {
  topXp: RankedUser[];
  topStreak: RankedUser[];
}
