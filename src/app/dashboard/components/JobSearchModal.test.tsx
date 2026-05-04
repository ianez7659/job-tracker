import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import JobSearchModal from "./JobSearchModal";

// window.open is not available in jsdom
const mockOpen = jest.fn();
beforeEach(() => {
  mockOpen.mockClear();
  Object.defineProperty(window, "open", { value: mockOpen, writable: true });
});

describe("JobSearchModal", () => {
  it("renders all job site options", () => {
    render(<JobSearchModal onClose={jest.fn()} />);
    expect(screen.getByText("LinkedIn")).toBeInTheDocument();
    expect(screen.getByText("Indeed")).toBeInTheDocument();
    expect(screen.getByText("GoJobs")).toBeInTheDocument();
    expect(screen.getByText("Glassdoor")).toBeInTheDocument();
    expect(screen.getByText("Monster")).toBeInTheDocument();
  });

  it("opens the correct URL in a new tab when a site is selected", async () => {
    const onClose = jest.fn();
    render(<JobSearchModal onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: /linkedin/i }));
    expect(mockOpen).toHaveBeenCalledWith(
      "https://www.linkedin.com/jobs",
      "_blank",
      "noopener,noreferrer",
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the close button is pressed", async () => {
    const onClose = jest.fn();
    render(<JobSearchModal onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the backdrop is clicked", async () => {
    const onClose = jest.fn();
    render(<JobSearchModal onClose={onClose} />);
    // The outermost dialog div is the backdrop
    await userEvent.click(screen.getByRole("dialog"));
    expect(onClose).toHaveBeenCalled();
  });
});
