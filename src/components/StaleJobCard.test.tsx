import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import StaleJobCard from "./StaleJobCard";

const push = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

function renderCard(props: Partial<React.ComponentProps<typeof StaleJobCard>> = {}) {
  const onRemove = jest.fn();
  render(
    <StaleJobCard
      id="stale-1"
      title="Backend Developer"
      company="Globex"
      createdAt="2026-09-01T00:00:00.000Z"
      daysInApplying={12}
      hasUrl={false}
      hasJd={false}
      onRemove={onRemove}
      {...props}
    />,
  );
  return { onRemove };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("StaleJobCard — move to trash", () => {
  it("removes immediately without a blocking confirm dialog (Undo is offered instead)", async () => {
    const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(false);
    const { onRemove } = renderCard();

    await userEvent.click(screen.getByRole("button", { name: "Move job to trash" }));

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(onRemove).toHaveBeenCalledWith("stale-1");
    expect(push).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it("does not remove while a removal is already in progress", async () => {
    const { onRemove } = renderCard({ busy: true });

    await userEvent.click(screen.getByRole("button", { name: "Move job to trash" }));

    expect(onRemove).not.toHaveBeenCalled();
  });

  it("opens the job detail page when the card body is clicked", async () => {
    renderCard();

    await userEvent.click(screen.getByText("Backend Developer"));

    expect(push).toHaveBeenCalledWith("/dashboard/jobs/edit/stale-1");
  });
});
