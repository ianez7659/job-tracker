import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import LoginClient from "./LoginClient";

jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
}));

let mockSearchParams = new URLSearchParams();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => mockSearchParams,
}));

describe("LoginClient (login page)", () => {
  beforeEach(() => {
    mockSearchParams = new URLSearchParams();
  });

  it("renders login form with email and password inputs", () => {
    render(<LoginClient />);
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /login/i })).toBeInTheDocument();
  });

  it("renders GitHub and Google sign-in buttons", () => {
    render(<LoginClient />);
    expect(screen.getByRole("button", { name: /github/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /google/i })).toBeInTheDocument();
  });

  it("shows registration form when Register link is clicked", async () => {
    render(<LoginClient />);
    await userEvent.click(screen.getByText(/first time here\? register/i));
    expect(await screen.findByPlaceholderText("Name")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: /registration/i })).toBeInTheDocument();
  });

  it("opens directly in registration mode when ?register=1 is present", () => {
    mockSearchParams = new URLSearchParams("register=1");
    render(<LoginClient />);
    expect(screen.getByRole("heading", { name: /registration/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Name")).toBeInTheDocument();
  });
});
