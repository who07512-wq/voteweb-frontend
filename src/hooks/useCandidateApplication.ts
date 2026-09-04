"use client";

import { useState, useEffect } from "react";
import {
  getMyApplication,
  type CandidateApplicationData,
} from "@/lib/candidate-api";

export function useCandidateApplication() {
  const [application, setApplication] = useState<CandidateApplicationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const app = await getMyApplication();
        if (alive) setApplication(app);
      } catch {
        if (alive) setApplication(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return { application, loading };
}

export async function getCandidateApplication(): Promise<CandidateApplicationData | null> {
  try {
    return await getMyApplication();
  } catch {
    return null;
  }
}