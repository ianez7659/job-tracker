import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Archive - Jobflow",
  description: "View your archived job applications including offers and rejected applications.",
};

export default function ArchiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

