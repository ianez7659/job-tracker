import { useCallback, useEffect, useState } from "react";
import type { Job } from "@/generated/prisma";

export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const refetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/jobs", { cache: "no-store" });
      if (!res.ok) {
        console.error("Failed to fetch jobs:", res.status, res.statusText);
        setJobs([]);
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setJobs(data);
      } else {
        console.error("Invalid data format:", data);
        setJobs([]);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetchJobs();
  }, [refetchJobs]);

  return { jobs, setJobs, loading, refetchJobs };
}
