import { render, screen, waitFor } from "@testing-library/react";
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

beforeEach(() => {
  jest.clearAllMocks();
});

describe("JobCard — move to trash", () => {
  it("sends exactly one soft-delete request and then tells the parent", async () => {
    const fetchMock = mockFetch({ ok: true });
    const { onDelete } = renderCard();

    await userEvent.click(screen.getByRole("button", { name: "Move job to trash" }));

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

    await userEvent.click(screen.getByRole("button", { name: "Move job to trash" }));

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

    await userEvent.click(screen.getByRole("button", { name: "Move job to trash" }));
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

    await userEvent.click(screen.getByRole("button", { name: "Move job to trash" }));
    await waitFor(() => expect(mockedToast).toHaveBeenCalled());
    await clickUndo();

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("does not call onRestored when the restore request fails", async () => {
    mockFetch({ ok: true }, { ok: false });
    const onRestored = jest.fn();
    renderCard({ onRestored });

    await userEvent.click(screen.getByRole("button", { name: "Move job to trash" }));
    await waitFor(() => expect(mockedToast).toHaveBeenCalled());
    await clickUndo();

    expect(onRestored).not.toHaveBeenCalled();
    expect(mockedToast.error).toHaveBeenCalledWith("Failed to restore job");
  });
});

describe("JobCard — design tokens", () => {
  // Stage stripe/badge come from STATUS_COLORS (documented exception), so use a
  // non-yellow stage and check only the card's own classes.
  function ownClasses(container: HTMLElement) {
    return Array.from(container.querySelectorAll<HTMLElement>("*"))
      .filter((el) => !/\b(bg|text)-(indigo|emerald|green|red|amber|orange|yellow)-\d+/.test(el.className))
      .map((el) => el.getAttribute("class") ?? "")
      .join(" ");
  }

  it("uses Signal for hover/focus and the posting link, with no dark-mode yellow", () => {
    const { container } = renderCard({ url: "https://www.linkedin.com/jobs", source: JobSource.WALK_IN });
    const card = screen.getByRole("button", { name: /frontend developer/i });

    expect(card).toHaveClass("bg-surface", "border-line", "hover:border-signal", "focus-visible:ring-signal");
    expect(screen.getByRole("link", { name: /link to original posting/i })).toHaveClass("text-signal");
    expect(screen.getByRole("link", { name: /interview prep/i })).toHaveClass("text-signal", "bg-signal/10");
    expect(ownClasses(container)).not.toMatch(/yellow-|amber-/);
  });

  it("keeps helper copy at 12px or larger", () => {
    const { container } = renderCard();
    expect(container.innerHTML).not.toMatch(/text-\[1[01]px\]/);
  });
});
