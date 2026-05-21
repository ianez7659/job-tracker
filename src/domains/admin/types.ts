// Admin domain types — no DB schema dependency, derived from query results

export type UserStatus = "active" | "at_risk" | "hired";

export interface ActiveUserPreview {
  id: string;
  name: string | null;
  email: string;
  category: string | null;
}

export interface SupportUserPreview {
  id: string;
  name: string | null;
  email: string;
  reason: "no_jobs" | "inactive";
}

export interface StuckUserPreview {
  id: string;
  name: string | null;
  email: string;
  applicationCount: number;
}

export interface HiredUserPreview {
  id: string;
  name: string | null;
  email: string;
  category: string | null;
}

export interface AdminOverview {
  currentlyActiveUsers: number;     // last 3 days DAILY_ACTIVITY
  totalStudents: number;            // hubStatus STUDENT or ALUMNI (non-STAFF, non-null category)
  hiredCount: number;               // users with at least one offer job
  hiredRate: number;                // hiredCount / totalStudents (0–1)
  stuckApplicationsCount: number;   // jobs stuck in applying/resume 14+ days
  stuckUsersCount: number;          // users with 3+ applying/resume jobs, no interview/offer
  needsSupportCount: number;        // 14+ days no activity OR 0 jobs
  categoryDistribution: CategoryCount[];
  topActiveUsers: ActiveUserPreview[];
  topSupportUsers: SupportUserPreview[];
  topStuckUsers: StuckUserPreview[];
  topHiredUsers: HiredUserPreview[];
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

// ── User detail for /admin/users/[id] ────────────────────────────────────────

export interface AdminUserDetailJob {
  id: string;
  title: string;
  company: string;
  status: string;
  appliedAt: Date;
  updatedAt: Date;
  hasUrl: boolean;
  hasJd: boolean;
  hasNotes: boolean;
}

export interface AdminUserDetail {
  id: string;
  name: string | null;
  email: string;
  hubStatus: HubStatus;
  category: string | null;
  createdAt: Date;
  employmentStatus: EmploymentStatus;
  jobCounts: {
    total: number;
    applying: number;
    waiting: number;
    interview: number;
    rejected: number;
    offered: number;
  };
  totalXp: number;
  currentLevel: number;
  loginStreak: number;
  lastActiveAt: Date | null;
  jobs: AdminUserDetailJob[];
  // support signals
  signals: {
    noInterview: boolean;        // 3+ jobs but no interview/offer
    longStuck: boolean;          // any job stuck 14+ days in applying/resume
    lowActivity: boolean;        // no DAILY_ACTIVITY in last 14 days
    missingJobInfo: number;      // jobs missing url or jd
  };
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
