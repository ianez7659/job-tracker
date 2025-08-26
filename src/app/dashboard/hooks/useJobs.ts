import { useEffect, useState } from "react";
import type { Job } from "@/generated/prisma";

export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch("/api/jobs", { cache: "no-store" });
      const data = await res.json();
      setJobs(data);
      setLoading(false);
    })();
  }, []);

  return { jobs, setJobs, loading };
}
