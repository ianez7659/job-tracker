import { redirect } from "next/navigation";

// Registration lives on the sign-in screen; keep the old URL working.
export default function RegisterPage(): never {
  redirect("/login?register=1");
}
