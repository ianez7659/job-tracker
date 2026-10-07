import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import type { Job } from "@/generated/prisma";
import { JobSource } from "@/generated/prisma";
import DashboardClient from "./Client";
import { useJobs } from "@/app/dashboard/hooks/useJobs";

/**
 * Covers the Card List's three zero-row states. The regression this guards
 * against: an existing user who filters or mistypes a search being told to
 * "add your first job".
 */

jest.mock("@/app/dashboard/hooks/useJobs", () => ({
  useJobs: jest.fn(),
}));
jest.mock("@/app/dashboard/hooks/useAllJobs", () => ({
  useAllJobs: () => ({
    allJobs: [],
    setAllJobs: jest.fn(),
    refetchAllJobs: jest.fn(),
  }),
}));
jest.mock("@/app/dashboard/hooks/useSharedEntry", () => ({
  useSharedEntry: () => undefined,
}));
jest.mock("@/stores/useSharedDataStore", () => ({
  useSharedDataStore: () => ({
    isSharedEntry: false,
    setSharedData: jest.fn(),
    clearSharedData: jest.fn(),
  }),
}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

// Child sections that fetch or animate on mount — out of scope for this test.
jest.mock("@/app/dashboard/components/MissionsSection", () => ({
  __esModule: true,
  default: ({ collapsedByDefault }: { collapsedByDefault?: boolean }) => (
    <div data-testid="missions" data-collapsed={String(!!collapsedByDefault)} />
  ),
}));
jest.mock("@/app/dashboard/components/XpSummaryCard", () => ({
  __esModule: true,
  default: () => <div data-testid="xp-summary" />,
}));
jest.mock("@/app/dashboard/components/DashboardStreakPanel", () => ({
  __esModule: true,
  default: () => <div data-testid="streak" />,
}));
jest.mock("@/app/dashboard/components/InterviewDrillCtaButton", () => ({
  __esModule: true,
  default: () => <div data-testid="drill-cta" />,
}));
jest.mock("@/app/dashboard/components/FindJobsCtaCard", () => ({
  __esModule: true,
  default: () => <div data-testid="find-jobs-cta" />,
}));
jest.mock("@/app/dashboard/components/JobList", () => ({
  __esModule: true,
  default: ({
    jobs,
    onDelete,
    onRestored,
  }: {
    jobs: Job[];
    onDelete: (id: string) => void;
    onRestored?: (id: string) => void;
  }) => (
    <div data-testid="job-list">
      {jobs.length} cards
      {/* Stand-ins for JobCard calling back after its own PATCH / Undo. */}
      <button type="button" onClick={() => onDelete(jobs[0].id)}>
        mock-deleted
      </button>
      <button type="button" onClick={() => onRestored?.(jobs[0].id)}>
        mock-restored
      </button>
    </div>
  ),
}));

const mockedUseJobs = useJobs as jest.MockedFunction<typeof useJobs>;

function makeJob(overrides: Partial<Job>): Job {
  return {
    id: "j1",
    title: "Frontend Developer",
    company: "Acme",
    status: "resume",
    appliedAt: new Date("2026-07-01"),
    createdAt: new Date("2026-07-01"),
    tags: null,
    source: JobSource.ONLINE,
    userId: "u1",
    deletedAt: null,
    url: null,
    jd: null,
    resumeFile: null,
    cycleEndStage: null,
    ...overrides,
  } as Job;
}

function setJobsHook(jobs: Job[], loading = false) {
  const hook = {
    jobs,
    setJobs: jest.fn(),
    loading,
    refetchJobs: jest.fn(),
  };
  mockedUseJobs.mockReturnValue(hook);
  return hook;
}

function renderDashboard() {
  return render(<DashboardClient user={{ name: "Ian", email: "ian@example.com" }} />);
}

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: false, json: () => Promise.resolve({}) }),
  ) as unknown as typeof fetch;
});

describe("DashboardClient — Card List zero-row states", () => {
  it("shows the loading skeleton, not the empty state, while jobs load", () => {
    setJobsHook([], true);
    renderDashboard();

    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByText("No job applications yet.")).not.toBeInTheDocument();
  });

  it("shows the first-job invitation when the user has no jobs", () => {
    setJobsHook([]);
    renderDashboard();

    expect(screen.getByText("No job applications yet.")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add your first job/i }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("job-list")).not.toBeInTheDocument();
  });

  it("hides the count chip when there are no jobs at all", () => {
    setJobsHook([]);
    renderDashboard();

    expect(
      screen.getByRole("heading", { name: /card list/i }),
    ).toHaveTextContent(/^Card List$/);
  });

  it("renders the job list and its count when the user has jobs", () => {
    setJobsHook([makeJob({ id: "a" }), makeJob({ id: "b" })]);
    renderDashboard();

    expect(screen.getByTestId("job-list")).toHaveTextContent("2 cards");
    expect(
      screen.getByRole("heading", { name: /card list/i }),
    ).toHaveTextContent(/^Card List2$/);
    expect(screen.queryByText("No job applications yet.")).not.toBeInTheDocument();
  });

  it("shows the no-match state — never the first-job invitation — when a search matches nothing", async () => {
    setJobsHook([makeJob({ id: "a", company: "Acme", title: "Frontend" })]);
    renderDashboard();

    await userEvent.type(screen.getByLabelText("Search jobs"), "zzzz");

    expect(screen.getByText("No cards match this view.")).toBeInTheDocument();
    expect(screen.getByText(/nothing found for/i)).toHaveTextContent("zzzz");
    expect(screen.queryByText("No job applications yet.")).not.toBeInTheDocument();
  });

  it("collapses Missions when the user has no jobs, so the empty state is reachable on mobile", () => {
    setJobsHook([]);
    renderDashboard();

    expect(screen.getByTestId("missions")).toHaveAttribute(
      "data-collapsed",
      "true",
    );
  });

  it("leaves Missions expanded for a user who has jobs", () => {
    setJobsHook([makeJob({ id: "a" })]);
    renderDashboard();

    expect(screen.getByTestId("missions")).toHaveAttribute(
      "data-collapsed",
      "false",
    );
  });

  it("collapses Missions on a phone even when the user has jobs", () => {
    const original = window.matchMedia;
    window.matchMedia = jest.fn(() => ({
      matches: true,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })) as unknown as typeof window.matchMedia;
    setJobsHook([makeJob({ id: "a" })]);
    renderDashboard();

    expect(screen.getByTestId("missions")).toHaveAttribute(
      "data-collapsed",
      "true",
    );
    window.matchMedia = original;
  });

  it("does not collapse Missions while jobs are still loading", () => {
    setJobsHook([], true);
    renderDashboard();

    expect(screen.getByTestId("missions")).toHaveAttribute(
      "data-collapsed",
      "false",
    );
  });

  it("restores the list when the search is cleared from the no-match state", async () => {
    setJobsHook([makeJob({ id: "a", company: "Acme" })]);
    renderDashboard();

    await userEvent.type(screen.getByLabelText("Search jobs"), "zzzz");
    expect(screen.queryByTestId("job-list")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(screen.getByTestId("job-list")).toHaveTextContent("1 cards");
  });
});

describe("DashboardClient — delete and undo", () => {
  it("does not send a second soft-delete request after JobCard already sent one", async () => {
    setJobsHook([makeJob({ id: "a" })]);
    renderDashboard();

    await userEvent.click(screen.getByRole("button", { name: "mock-deleted" }));

    const patchCalls = (global.fetch as jest.Mock).mock.calls.filter(
      ([url, init]) => url === "/api/jobs/a" && init?.method === "PATCH",
    );
    expect(patchCalls).toHaveLength(0);
  });

  it("removes the deleted card from the list state", async () => {
    const hook = setJobsHook([makeJob({ id: "a" }), makeJob({ id: "b" })]);
    renderDashboard();

    await userEvent.click(screen.getByRole("button", { name: "mock-deleted" }));

    expect(hook.setJobs).toHaveBeenCalled();
    const updater = hook.setJobs.mock.calls[0][0] as (prev: Job[]) => Job[];
    expect(updater([makeJob({ id: "a" }), makeJob({ id: "b" })]).map((j) => j.id)).toEqual(["b"]);
  });

  it("refetches jobs when a card is restored from Undo, so it reappears without a reload", async () => {
    const hook = setJobsHook([makeJob({ id: "a" })]);
    renderDashboard();

    await userEvent.click(screen.getByRole("button", { name: "mock-restored" }));

    expect(hook.refetchJobs).toHaveBeenCalledTimes(1);
    expect(hook.refetchJobs).toHaveBeenCalledWith({ silent: true });
  });
});

describe("DashboardClient — counts agree", () => {
  const STALE = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
  const jobs = () => [
    makeJob({ id: "s1", status: "applying", createdAt: STALE }),
    makeJob({ id: "s2", status: "applying", createdAt: STALE }),
    makeJob({ id: "r1", status: "resume" }),
    makeJob({ id: "r2", status: "resume" }),
    makeJob({ id: "i1", status: "interview2" }),
  ];

  it("labels Overview's past-Applying total as Submitted, not Applied", () => {
    setJobsHook(jobs());
    renderDashboard();

    expect(screen.getAllByText("Submitted").length).toBeGreaterThan(0);
  });

  it("gives Progress the same Applying count as Overview and the Applied stage count", () => {
    setJobsHook(jobs());
    renderDashboard();

    const applying = screen.getByRole("button", { name: /^Applying\s*2$/ });
    const applied = screen.getByRole("button", { name: /^Applied\s*2$/ });
    const interviews = screen.getByRole("button", { name: /^Interviews\s*1$/ });
    expect(applying).toBeInTheDocument();
    expect(applied).toBeInTheDocument();
    expect(interviews).toBeInTheDocument();
  });

  it("lists every interview round when Interviews is selected", async () => {
    setJobsHook([
      makeJob({ id: "i1", status: "interview1" }),
      makeJob({ id: "i2", status: "interview2" }),
      makeJob({ id: "i3", status: "interview3" }),
      makeJob({ id: "r1", status: "resume" }),
    ]);
    renderDashboard();

    await userEvent.click(screen.getByRole("button", { name: /^Interviews\s*3$/ }));

    expect(screen.getByTestId("job-list")).toHaveTextContent("3 cards");
  });

  it("explains the gap between the chip and Total when stale cards are stacked", () => {
    setJobsHook(jobs());
    renderDashboard();

    expect(
      screen.getByRole("heading", { name: /card list/i }),
    ).toHaveTextContent(/^Card List3 shown · 2 stale$/);
  });
});
