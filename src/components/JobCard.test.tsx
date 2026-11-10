import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { toast } from "sonner";
import JobCard from "./JobCard";
import { JobSource } from "@/generated/prisma";

const push = jest.fn();
const refresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

jest.mock("sonner", () => {
  const toastFn = jest.fn() as jest.Mock & {
    error: jest.Mock;
    success: jest.Mock;
  };
  toastFn.error = jest.fn();
  toastFn.success = jest.fn();
  return { toast: toastFn };
});

type ToastOptions = { action: { label: string; onClick: () => Promise<void> } };

const mockedToast = toast as unknown as jest.Mock & {
  error: jest.Mock;
  success: jest.Mock;
};

function mockFetch(...responses: Array<{ ok: boolean }>) {
  const fn = jest.fn();
  responses.forEach((r) => fn.mockResolvedValueOnce(r));
  global.fetch = fn as unknown as typeof fetch;
  return fn;
}

function renderCard(props: Partial<React.ComponentProps<typeof JobCard>> = {}) {
  const onDelete = jest.fn();
  const utils = render(
    <JobCard
      id="job-1"
      title="Frontend Developer"
      company="Acme"
      status="resume"
      onDelete={onDelete}
      {...props}
    />,
  );
  return { ...utils, onDelete };
}

/** Runs the "Undo" action passed to the "Moved to Trash" toast. */
async function clickUndo() {
  const options = mockedToast.mock.calls[0][1] as ToastOptions;
  expect(options.action.label).toBe("Undo");
  await options.action.onClick();
}

/** Opens the card's ··· menu and chooses "Move to trash". */
async function trash(company = "Acme") {
  await userEvent.click(screen.getByRole("button", { name: `More actions for ${company}` }));
  await userEvent.click(screen.getByRole("menuitem", { name: "Move to trash" }));
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("JobCard — move to trash", () => {
  it("sends exactly one soft-delete request and then tells the parent", async () => {
    const fetchMock = mockFetch({ ok: true });
    const { onDelete } = renderCard();

    await trash();

    await waitFor(() => expect(onDelete).toHaveBeenCalledWith("job-1"));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/jobs/job-1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ softDelete: true }),
      }),
    );
    expect(push).not.toHaveBeenCalled();
  });

  it("keeps the card and shows an error when the request fails", async () => {
    mockFetch({ ok: false });
    const { onDelete } = renderCard();

    await trash();

    await waitFor(() =>
      expect(mockedToast.error).toHaveBeenCalledWith("Failed to delete job"),
    );
    expect(onDelete).not.toHaveBeenCalled();
    expect(mockedToast).not.toHaveBeenCalled();
  });
});

describe("JobCard — undo", () => {
  it("restores the job and calls onRestored so the parent can show it again", async () => {
    const fetchMock = mockFetch({ ok: true }, { ok: true });
    const onRestored = jest.fn();
    renderCard({ onRestored });

    await trash();
    await waitFor(() => expect(mockedToast).toHaveBeenCalled());
    await clickUndo();

    expect(fetchMock).toHaveBeenLastCalledWith("/api/jobs/job-1/restore", {
      method: "PATCH",
    });
    expect(onRestored).toHaveBeenCalledWith("job-1");
    expect(refresh).not.toHaveBeenCalled();
  });

  it("falls back to a router refresh when no onRestored handler is given", async () => {
    mockFetch({ ok: true }, { ok: true });
    renderCard();

    await trash();
    await waitFor(() => expect(mockedToast).toHaveBeenCalled());
    await clickUndo();

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("does not call onRestored when the restore request fails", async () => {
    mockFetch({ ok: true }, { ok: false });
    const onRestored = jest.fn();
    renderCard({ onRestored });

    await trash();
    await waitFor(() => expect(mockedToast).toHaveBeenCalled());
    await clickUndo();

    expect(onRestored).not.toHaveBeenCalled();
    expect(mockedToast.error).toHaveBeenCalledWith("Failed to restore job");
  });
});

describe("JobCard — actions menu", () => {
  it("is closed by default and announces its state", () => {
    renderCard();
    const trigger = screen.getByRole("button", { name: "More actions for Acme" });
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("holds the posting link and walk-in interview prep", async () => {
    renderCard({ url: "https://example.org/job", source: JobSource.WALK_IN });
    await userEvent.click(screen.getByRole("button", { name: "More actions for Acme" }));

    expect(screen.getByRole("menuitem", { name: "Open original posting" })).toHaveAttribute(
      "href",
      "https://example.org/job",
    );
    expect(screen.getByRole("menuitem", { name: "Interview prep" })).toHaveAttribute(
      "href",
      "/dashboard/jobs/edit/job-1#interview-prep",
    );
  });

  it("omits items that do not apply", async () => {
    renderCard({ url: null, source: JobSource.ONLINE });
    await userEvent.click(screen.getByRole("button", { name: "More actions for Acme" }));
    expect(screen.getAllByRole("menuitem").map((el) => el.textContent)).toEqual(["Move to trash"]);
  });

  it("focuses the first item, moves with arrows, and closes on Escape back to the trigger", async () => {
    renderCard({ url: "https://example.org/job" });
    const trigger = screen.getByRole("button", { name: "More actions for Acme" });
    await userEvent.click(trigger);

    expect(screen.getByRole("menuitem", { name: "Open original posting" })).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Move to trash" })).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Open original posting" })).toHaveFocus();

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it("stacks the open menu above the card's own action button", async () => {
    renderCard({ status: "resume", onAdvance: jest.fn() });
    await userEvent.click(screen.getByRole("button", { name: "More actions for Acme" }));
    // The menu's z-30 only counts inside its wrapper's stacking context, so the
    // wrapper itself must outrank the later action button (they overlap on phones).
    const zOf = (el: Element) => Number(/(?:^|\s)z-\[(\d+)\]/.exec(el.className)?.[1] ?? 0);
    const wrapper = screen.getByRole("menu").parentElement!;
    const action = screen.getByRole("button", { name: /^Move to Interview 1/ });
    expect(zOf(wrapper)).toBeGreaterThan(zOf(action));
  });

  it("closes on a click outside", async () => {
    renderCard();
    await userEvent.click(screen.getByRole("button", { name: "More actions for Acme" }));
    await userEvent.click(document.body);
    expect(screen.queryByRole("menu")).toBeNull();
  });
});

describe("JobCard — anatomy", () => {
  it("headlines the company as the link to the detail page", () => {
    renderCard();
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("Acme");
    expect(screen.getByRole("link", { name: "Acme" })).toHaveAttribute(
      "href",
      "/dashboard/jobs/edit/job-1",
    );
  });

  it("shows the position level as a chip and when the card was added", () => {
    renderCard({ appliedAt: new Date() });
    expect(screen.getByText("Frontend Developer")).toHaveClass("rounded-full", "border-line");
    expect(screen.getByText("Added today")).toBeInTheDocument();
  });

  it("opens Applying cards on the Apply page", () => {
    renderCard({ status: "applying" });
    expect(screen.getByRole("link", { name: "Acme" })).toHaveAttribute(
      "href",
      "/dashboard/jobs/apply/job-1",
    );
  });

  it("falls back to the level when the company is blank, without repeating it", () => {
    renderCard({ company: "  " });
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("Frontend Developer");
    expect(screen.getAllByText("Frontend Developer")).toHaveLength(1);
  });

  it("carries the stage as a rail, not a raw enum badge", () => {
    const { container } = renderCard({ status: "interview1" });
    const rail = screen.getByRole("list", { name: "Application pipeline" });
    expect(within(rail).getAllByRole("listitem")).toHaveLength(5);
    expect(within(rail).getByText("Interview 1, current stage")).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/INTERVIEW|RESUME|APPLYING|interview\d/);
  });

  it("is not itself a button and nests no interactive element inside another", async () => {
    const { container } = renderCard({
      url: "https://example.org/job",
      source: JobSource.WALK_IN,
      onAdvance: jest.fn(),
    });
    await userEvent.click(screen.getByRole("button", { name: "More actions for Acme" }));
    expect(container.querySelector("[role=button]")).toBeNull();
    expect(container.querySelector("a a, a button, button a, button button")).toBeNull();
  });

  it("uses tokens for its own surface, with no clipping and no dark-mode yellow", () => {
    const { container } = renderCard();
    const card = container.querySelector("article")!;
    expect(card).toHaveClass(
      "bg-surface",
      "border-line",
      "hover:border-signal",
      "has-[.job-card-link:focus-visible]:ring-signal",
    );
    expect(card).not.toHaveClass("overflow-hidden");
    expect(container.innerHTML).not.toMatch(/dark:[a-z-]*yellow-/);
  });

  it("keeps text at 12px or larger", () => {
    const { container } = renderCard();
    expect(container.innerHTML).not.toMatch(/text-\[1[01](\.\d)?px\]/);
  });
});

describe("JobCard — next checkpoint", () => {
  it.each([
    ["resume", "Move to Interview 1"],
    ["interview1", "Move to Interview 2"],
    ["interview2", "Move to Interview 3"],
  ])("on %s offers '%s' and calls onAdvance with the card", async (status, text) => {
    const onAdvance = jest.fn();
    renderCard({ status, onAdvance });

    expect(screen.getByText("Next checkpoint")).toBeInTheDocument();
    const button = screen.getByRole("button", { name: `${text} for Acme` });
    expect(button).toHaveTextContent(text);
    await userEvent.click(button);

    expect(onAdvance).toHaveBeenCalledWith({ id: "job-1", company: "Acme", status });
    expect(push).not.toHaveBeenCalled();
  });

  it("sends Applying cards to the Apply flow instead of advancing", () => {
    const onAdvance = jest.fn();
    renderCard({ status: "applying", onAdvance });
    expect(screen.getByRole("link", { name: /submit application/i })).toHaveAttribute(
      "href",
      "/dashboard/jobs/apply/job-1",
    );
    expect(screen.queryByRole("button", { name: /^move to/i })).toBeNull();
  });

  it("sends Interview 3 cards to the job page to record the outcome", () => {
    renderCard({ status: "interview3", onAdvance: jest.fn() });
    expect(screen.getByRole("link", { name: /record outcome/i })).toHaveAttribute(
      "href",
      "/dashboard/jobs/edit/job-1",
    );
    expect(screen.queryByRole("button", { name: /^move to/i })).toBeNull();
  });

  it.each(["offer", "rejected"])("shows no next checkpoint on a closed %s card", (status) => {
    renderCard({ status, onAdvance: jest.fn() });
    expect(screen.queryByText("Next checkpoint")).toBeNull();
  });

  it("shows the outcome on a closed card's rail", () => {
    renderCard({ status: "rejected", cycleEndStage: "interview1" });
    const rail = screen.getByRole("list", { name: "Application pipeline" });
    expect(within(rail).getByText("Rejected, outcome")).toBeInTheDocument();
    expect(within(rail).getByText("Interview 2, not reached")).toBeInTheDocument();
  });

  it("shows no advance button when the parent gives no handler", () => {
    renderCard({ status: "resume" });
    expect(screen.queryByRole("button", { name: /^move to/i })).toBeNull();
  });

  it("shows a disabled saving state while a move is pending", () => {
    renderCard({ status: "interview1", onAdvance: jest.fn(), advancePending: true });
    expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled();
    expect(screen.queryByRole("button", { name: /^move to/i })).toBeNull();
  });

  it("saves a pending move before opening the detail page", async () => {
    let release!: () => void;
    const onBeforeOpen = jest.fn(() => new Promise<void>((r) => { release = r; }));
    renderCard({ status: "interview1", advancePending: true, onBeforeOpen });

    await userEvent.click(screen.getByRole("link", { name: "Acme" }));
    expect(onBeforeOpen).toHaveBeenCalledWith("job-1");
    expect(push).not.toHaveBeenCalled();

    release();
    await waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard/jobs/edit/job-1"));
  });

  it("opens the detail page normally when nothing is pending", async () => {
    const onBeforeOpen = jest.fn();
    renderCard({ onBeforeOpen });
    await userEvent.click(screen.getByRole("link", { name: "Acme" }));
    expect(onBeforeOpen).not.toHaveBeenCalled();
  });
});
