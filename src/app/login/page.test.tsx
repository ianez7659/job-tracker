import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import LoginClient from "./LoginClient";
import { AUTH_FALLBACK_MESSAGE } from "@/lib/authErrors";

beforeAll(() => {
  window.matchMedia =
    window.matchMedia ||
    jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
});

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

  it("renders a sign-in form with labelled, autocomplete-ready fields", () => {
    render(<LoginClient />);
    expect(screen.getByRole("heading", { level: 1, name: "Sign in" })).toBeInTheDocument();

    const email = screen.getByLabelText("Email");
    expect(email).toHaveAttribute("type", "email");
    expect(email).toHaveAttribute("autocomplete", "email");
    expect(email).toBeRequired();

    const password = screen.getByLabelText("Password");
    expect(password).toHaveAttribute("type", "password");
    expect(password).toHaveAttribute("autocomplete", "current-password");
    expect(password).toBeRequired();

    expect(screen.getByRole("button", { name: "Sign in" })).toHaveAttribute("type", "submit");
    expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();
  });

  it("shows the brand mark", () => {
    render(<LoginClient />);
    expect(screen.getByText("Jobflow")).toBeInTheDocument();
  });

  it("renders GitHub and Google sign-in buttons", () => {
    render(<LoginClient />);
    expect(screen.getByRole("button", { name: "Continue with GitHub" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue with Google" })).toBeInTheDocument();
  });

  it("does not render the demo-account shortcut", () => {
    render(<LoginClient />);
    expect(screen.queryByText(/demo/i)).not.toBeInTheDocument();
  });

  it("switches to registration with a keyboard-reachable button", async () => {
    const user = userEvent.setup();
    render(<LoginClient />);

    const toggle = screen.getByRole("button", { name: "Create an account" });
    toggle.focus();
    await user.keyboard("{Enter}");

    expect(await screen.findByRole("heading", { name: "Create your account" })).toBeInTheDocument();
    const name = screen.getByLabelText("Name");
    expect(name).toHaveAttribute("autocomplete", "name");
    expect(screen.getByLabelText("Password")).toHaveAttribute("autocomplete", "new-password");
    expect(screen.getByRole("button", { name: "Create account" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();
  });

  it("opens directly in registration mode when ?register=1 is present", () => {
    mockSearchParams = new URLSearchParams("register=1");
    render(<LoginClient />);
    expect(screen.getByRole("heading", { name: "Create your account" })).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
  });

  it("shows a URL error code in user language, never the configuration detail", () => {
    mockSearchParams = new URLSearchParams("error=Configuration");
    render(<LoginClient />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(AUTH_FALLBACK_MESSAGE);
    expect(alert).not.toHaveTextContent(/NEXTAUTH|SECRET|server/i);
  });

  it("clears the URL error when the mode changes", async () => {
    const user = userEvent.setup();
    mockSearchParams = new URLSearchParams("error=AccessDenied");
    render(<LoginClient />);
    expect(screen.getByRole("alert")).toHaveTextContent("Sign-in was cancelled.");

    await user.click(screen.getByRole("button", { name: "Create an account" }));
    await screen.findByRole("heading", { name: "Create your account" });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows no alert without an error code", () => {
    render(<LoginClient />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
