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
  useAllJobs: () => ({ allJobs: [], setAllJobs: jest.fn() }),
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
  default: () => <div data-testid="missions" />,
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
  default: ({ jobs }: { jobs: Job[] }) => (
    <div data-testid="job-list">{jobs.length} cards</div>
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
  mockedUseJobs.mockReturnValue({
    jobs,
    setJobs: jest.fn(),
    loading,
    refetchJobs: jest.fn(),
  });
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

  it("restores the list when the search is cleared from the no-match state", async () => {
    setJobsHook([makeJob({ id: "a", company: "Acme" })]);
    renderDashboard();

    await userEvent.type(screen.getByLabelText("Search jobs"), "zzzz");
    expect(screen.queryByTestId("job-list")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(screen.getByTestId("job-list")).toHaveTextContent("1 cards");
  });
});
