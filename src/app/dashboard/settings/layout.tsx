import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings - Jobflow",
  description: "Manage your Jobflow account settings including theme preferences and notification settings.",
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

