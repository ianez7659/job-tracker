import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import LoginPage from "./page";

jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe("LoginPage", () => {
  it("renders login form with email and password inputs", () => {
    render(<LoginPage />);
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /login/i })).toBeInTheDocument();
  });

  it("renders GitHub and Google sign-in buttons", () => {
    render(<LoginPage />);
    expect(screen.getByRole("button", { name: /github/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /google/i })).toBeInTheDocument();
  });

  it("shows registration form when Register link is clicked", async () => {
    render(<LoginPage />);
    await userEvent.click(screen.getByText(/first time here\? register/i));
    expect(await screen.findByPlaceholderText("Name")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: /registration/i })).toBeInTheDocument();
  });
});
