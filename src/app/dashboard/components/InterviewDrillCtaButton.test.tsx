import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import InterviewDrillCtaButton from "./InterviewDrillCtaButton";

const push = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

beforeEach(() => push.mockClear());

describe("InterviewDrillCtaButton", () => {
  it("invites the drill in Streak (reward), never green", () => {
    render(<InterviewDrillCtaButton drillStatus="not_started" allDailyDone={false} />);

    const button = screen.getByRole("button", { name: "Start Drill" });
    expect(button.className).toMatch(/streak/);
    expect(button.className).not.toMatch(/emerald|green/);
  });

  it("goes quiet and offers practice once the drill is done", () => {
    render(<InterviewDrillCtaButton drillStatus="completed" allDailyDone />);

    const button = screen.getByRole("button", { name: "Practice Drill" });
    expect(button.className).not.toMatch(/emerald|green/);
    fireEvent.click(button);
    expect(push).toHaveBeenCalledWith("/dashboard/interview-drill?mode=practice");
  });

  it("continues an in-progress drill", () => {
    render(<InterviewDrillCtaButton drillStatus="in_progress" allDailyDone={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Continue Drill" }));
    expect(push).toHaveBeenCalledWith("/dashboard/interview-drill");
  });

  it("renders nothing while the drill mission is listed in Missions", () => {
    const { container } = render(
      <InterviewDrillCtaButton drillStatus="not_started" allDailyDone={false} hiddenByMission />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
