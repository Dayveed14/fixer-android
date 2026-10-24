import { useCallback, useEffect, useState } from "react";
import { listMyAppointments, listMyRepairs, listMyTickets } from "../../core/api/technician.api";
import { buildJobs } from "../../core/utils/jobs";

/**
 * The technician's appointments, repairs and tickets (same as the web's
 * useTechnicianJobs). Each list loads independently so one failing
 * doesn't hide the others.
 */
export default function useJobs() {
  const [data, setData] = useState({ appointments: [], repairs: [], tickets: [] });
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);

  const load = useCallback(async () => {
    const wanted = [
      ["appointments", listMyAppointments],
      ["repairs", listMyRepairs],
      ["tickets", listMyTickets],
    ];
    const results = await Promise.allSettled(wanted.map(([, fn]) => fn()));
    const next = { appointments: [], repairs: [], tickets: [] };
    const failed = [];
    results.forEach((r, i) => {
      const [key] = wanted[i];
      if (r.status === "fulfilled" && Array.isArray(r.value)) next[key] = r.value;
      else if (r.status === "rejected") failed.push(`Couldn't load ${key}: ${r.reason?.message || "error"}`);
    });
    setData(next);
    setErrors(failed);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const onVisible = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [load]);

  return { ...data, jobs: buildJobs(data), loading, errors, reload: load };
}
