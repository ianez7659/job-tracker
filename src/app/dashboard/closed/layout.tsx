import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Closed - Jobflow",
  description: "Review your closed job applications — offers received and rejections.",
};

export default function ClosedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
