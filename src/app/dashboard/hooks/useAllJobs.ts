import { useEffect, useState } from "react";
import type { Job } from "@/generated/prisma";

export function useAllJobs() {
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [loadingAll, setLoadingAll] = useState(true);

  useEffect(() => {
    (async () => {
      setLoadingAll(true);
      const res = await fetch("/api/jobs/all", { cache: "no-store" });
      const data = await res.json();
      setAllJobs(data);
      setLoadingAll(false);
    })();
  }, []);

  return { allJobs, setAllJobs, loadingAll };
}
