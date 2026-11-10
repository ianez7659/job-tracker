import { redirect } from "next/navigation";
import RegisterPage from "./page";

jest.mock("next/navigation", () => ({
  redirect: jest.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

describe("/register", () => {
  it("redirects to the sign-in screen in registration mode", () => {
    expect(() => RegisterPage()).toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/login?register=1");
    expect(redirect).toHaveBeenCalledTimes(1);
  });
});
