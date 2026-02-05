import { useEffect, useState } from "react";
import type { Job } from "@/generated/prisma";

export function useAllJobs() {
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [loadingAll, setLoadingAll] = useState(true);

  useEffect(() => {
    (async () => {
      setLoadingAll(true);
      try {
        const res = await fetch("/api/jobs/all", { cache: "no-store" });
        if (!res.ok) {
          console.error("Failed to fetch all jobs:", res.status, res.statusText);
          setAllJobs([]);
          setLoadingAll(false);
          return;
        }
        const data = await res.json();
        // Ensure data is an array
        if (Array.isArray(data)) {
          setAllJobs(data);
        } else {
          console.error("Invalid data format:", data);
          setAllJobs([]);
        }
      } catch (error) {
        console.error("Error fetching all jobs:", error);
        setAllJobs([]);
      } finally {
        setLoadingAll(false);
      }
    })();
  }, []);

  return { allJobs, setAllJobs, loadingAll };
}
