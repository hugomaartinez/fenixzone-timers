"use client";

import { useEffect, useMemo, useState } from "react";
import { onValue, ref } from "firebase/database";
import { database } from "@/app/firebase";

export interface TransportistaEvent {
  id: string;
  calledAt: number;
  detectedAt: number;
  intervalMs?: number;
  source?: string;
  line?: string;
}

export interface TransportistaStatus {
  agentName?: string;
  lastSeenAt?: number;
  lastRejectedAt?: number;
  lastRejectedReason?: string;
  lastRejectedIntervalMs?: number;
}

const MIN_REAL_INTERVAL_MS = 4 * 60 * 1000 + 45 * 1000;
const MAX_REAL_INTERVAL_MS = 5 * 60 * 1000 + 25 * 1000;
const FALLBACK_INTERVAL_MS = 306000;

function isRealisticInterval(intervalMs: number) {
  return intervalMs >= MIN_REAL_INTERVAL_MS && intervalMs <= MAX_REAL_INTERVAL_MS;
}

function average(values: number[]) {
  if (values.length === 0) {
    return FALLBACK_INTERVAL_MS;
  }

  return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
}

export function useTransportista(groupId: string) {
  const [events, setEvents] = useState<TransportistaEvent[]>([]);
  const [status, setStatus] = useState<TransportistaStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const eventsRef = ref(database, `groups/${groupId}/transportista/events`);

    const unsubscribe = onValue(eventsRef, (snapshot) => {
      const rawEvents = snapshot.val() ?? {};
      const nextEvents = Object.entries(rawEvents)
        .map(([id, value]) => ({
          id,
          ...(value as Omit<TransportistaEvent, "id">),
        }))
        .filter((event) => typeof event.calledAt === "number")
        .sort((a, b) => a.calledAt - b.calledAt);

      setEvents(nextEvents);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId]);

  useEffect(() => {
    const statusRef = ref(database, `groups/${groupId}/transportista/status`);

    const unsubscribe = onValue(statusRef, (snapshot) => {
      setStatus(snapshot.val());
    });

    return () => unsubscribe();
  }, [groupId]);

  return useMemo(() => {
    const intervals = events
      .map((event, index) => {
        if (event.intervalMs) {
          return event.intervalMs;
        }

        const previousEvent = events[index - 1];
        return previousEvent ? event.calledAt - previousEvent.calledAt : null;
      })
      .filter((interval): interval is number => interval !== null)
      .filter(isRealisticInterval);
    const averageIntervalMs = average(intervals);
    const lastEvent = events[events.length - 1] ?? null;

    return {
      averageIntervalMs,
      events,
      fallbackIntervalMs: FALLBACK_INTERVAL_MS,
      lastEvent,
      loading,
      maxRealIntervalMs: MAX_REAL_INTERVAL_MS,
      minRealIntervalMs: MIN_REAL_INTERVAL_MS,
      nextCallAt: lastEvent ? lastEvent.calledAt + averageIntervalMs : null,
      realisticIntervalsCount: intervals.length,
      status,
    };
  }, [events, loading, status]);
}
