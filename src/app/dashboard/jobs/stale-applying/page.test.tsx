import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { toast } from "sonner";
import StaleApplyingPage from "./page";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
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

const staleJob = {
  id: "s1",
  title: "Backend Developer",
  company: "Globex",
  status: "applying",
  createdAt: "2026-09-01T00:00:00.000Z",
  daysInApplying: 12,
  url: null,
  hasUrl: false,
  hasJd: false,
};

function json(body: unknown, ok = true) {
  return Promise.resolve({ ok, json: () => Promise.resolve(body) });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("StaleApplyingPage — move to trash with Undo", () => {
  it("removes the card and offers Undo that restores and reloads the list", async () => {
    const fetchMock = jest
      .fn()
      .mockReturnValueOnce(json({ jobs: [staleJob] })) // initial load
      .mockReturnValueOnce(json({})) // soft delete
      .mockReturnValueOnce(json({})) // restore
      .mockReturnValueOnce(json({ jobs: [staleJob] })); // reload after restore
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<StaleApplyingPage />);
    await userEvent.click(
      await screen.findByRole("button", { name: "Move job to trash" }),
    );

    await waitFor(() =>
      expect(screen.queryByText("Backend Developer")).not.toBeInTheDocument(),
    );
    expect(mockedToast).toHaveBeenCalledWith(
      "Moved to Trash",
      expect.objectContaining({ description: "Backend Developer @ Globex" }),
    );

    const options = mockedToast.mock.calls[0][1] as ToastOptions;
    await options.action.onClick();

    expect(fetchMock).toHaveBeenCalledWith("/api/jobs/s1/restore", {
      method: "PATCH",
    });
    expect(await screen.findByText("Backend Developer")).toBeInTheDocument();
  });

  it("keeps the card and shows an error when the delete request fails", async () => {
    global.fetch = jest
      .fn()
      .mockReturnValueOnce(json({ jobs: [staleJob] }))
      .mockReturnValueOnce(json({}, false)) as unknown as typeof fetch;

    render(<StaleApplyingPage />);
    await userEvent.click(
      await screen.findByRole("button", { name: "Move job to trash" }),
    );

    await waitFor(() =>
      expect(mockedToast.error).toHaveBeenCalledWith("Failed to delete job"),
    );
    expect(screen.getByText("Backend Developer")).toBeInTheDocument();
    expect(mockedToast).not.toHaveBeenCalled();
  });
});
