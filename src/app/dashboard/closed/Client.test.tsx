import { render, screen, fireEvent } from "@testing-library/react";
import type { Job } from "@/generated/prisma";
import { JobSource } from "@/generated/prisma";
import ClosedClient from "./Client";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

jest.mock("@/components/JobCard", () => ({
  __esModule: true,
  default: ({ title, status }: { title: string; status: string }) => (
    <div data-testid="job-card">{`${title} (${status})`}</div>
  ),
}));

function makeJob(overrides: Partial<Job>): Job {
  return {
    id: "j",
    title: "Title",
    company: "Company",
    status: "offer",
    appliedAt: new Date("2024-01-01"),
    tags: null,
    source: JobSource.ONLINE,
    userId: "u1",
    createdAt: new Date("2024-01-01"),
    deletedAt: null,
    url: null,
    jd: null,
    resumeFile: null,
    cycleEndStage: null,
    ...overrides,
  } as Job;
}

const jobs: Job[] = [
  makeJob({ id: "o1", title: "Offer One", status: "offer" }),
  makeJob({
    id: "r1",
    title: "Reject One",
    status: "rejected",
    cycleEndStage: "interview2",
  }),
  makeJob({ id: "r2", title: "Reject Two", status: "rejected", cycleEndStage: null }),
];

describe("ClosedClient", () => {
  it("shows the offer/rejected summary counts", () => {
    render(<ClosedClient jobs={jobs} />);
    expect(screen.getByText("1 offer · 2 rejected")).toBeInTheDocument();
  });

  it("shows offers by default and switches to rejected on tab click", () => {
    render(<ClosedClient jobs={jobs} />);
    expect(screen.getByText("Offer One (offer)")).toBeInTheDocument();
    expect(screen.queryByText("Reject One (rejected)")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /Rejected/ }));
    expect(screen.getByText("Reject One (rejected)")).toBeInTheDocument();
    expect(screen.queryByText("Offer One (offer)")).not.toBeInTheDocument();
  });

  it("shows the last stage reached for rejected jobs that have cycleEndStage", () => {
    render(<ClosedClient jobs={jobs} />);
    fireEvent.click(screen.getByRole("tab", { name: /Rejected/ }));
    expect(screen.getByText("Closed after: Interview 2")).toBeInTheDocument();
  });

  it("links to the Stats page", () => {
    render(<ClosedClient jobs={jobs} />);
    expect(screen.getByRole("link", { name: /See Stats/ })).toHaveAttribute(
      "href",
      "/dashboard/stats",
    );
  });
});
