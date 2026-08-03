import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import NoMatchingJobsState from "./NoMatchingJobsState";

describe("NoMatchingJobsState", () => {
  it("echoes the search term back to the user", () => {
    render(
      <NoMatchingJobsState
        searchTerm="acme"
        hasStatusFilter={false}
        onClear={jest.fn()}
      />,
    );
    expect(screen.getByText(/nothing found for/i)).toHaveTextContent("acme");
  });

  it("explains an empty stage when only a status filter is active", () => {
    render(
      <NoMatchingJobsState
        searchTerm=""
        hasStatusFilter
        onClear={jest.fn()}
      />,
    );
    expect(
      screen.getByText("This stage has no cards right now."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Show all cards" }),
    ).toBeInTheDocument();
  });

  it("labels the reset button for search only", () => {
    render(
      <NoMatchingJobsState
        searchTerm="acme"
        hasStatusFilter={false}
        onClear={jest.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Clear search" }),
    ).toBeInTheDocument();
  });

  it("labels the reset button for search and filter together", () => {
    render(
      <NoMatchingJobsState searchTerm="acme" hasStatusFilter onClear={jest.fn()} />,
    );
    expect(
      screen.getByRole("button", { name: "Clear search and filter" }),
    ).toBeInTheDocument();
  });

  it("treats a whitespace-only search as no search", () => {
    render(
      <NoMatchingJobsState
        searchTerm="   "
        hasStatusFilter
        onClear={jest.fn()}
      />,
    );
    expect(
      screen.getByText("This stage has no cards right now."),
    ).toBeInTheDocument();
  });

  it("calls onClear when the reset button is pressed", async () => {
    const onClear = jest.fn();
    render(
      <NoMatchingJobsState
        searchTerm="acme"
        hasStatusFilter={false}
        onClear={onClear}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
