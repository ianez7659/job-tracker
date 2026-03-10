"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import type { Session } from "next-auth";

export default function CategoryGuard({
  session,
  children,
}: {
  session: Session | null;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!session?.user) return;
    const category = (session.user as { category?: string | null }).category;
    const hasCategory = category != null && category !== "";
    const onCategoryPage = pathname === "/dashboard/category";

    if (!hasCategory && !onCategoryPage) {
      router.replace("/dashboard/category");
      return;
    }
    if (hasCategory && onCategoryPage) {
      router.replace("/dashboard");
    }
  }, [session, pathname, router]);

  return <>{children}</>;
}

