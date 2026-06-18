"use client";

import { useEffect, useMemo, useState } from "react";
import { onValue, ref } from "firebase/database";
import { database } from "@/app/firebase";

export interface TransportistaEvent {
  id: string;
  agentId?: string;
  calledAt: number;
  detectedAt: number;
  intervalMs?: number;
  agentName?: string;
  source?: string;
  line?: string;
}

export interface TransportistaAgentStatus {
  agentId?: string;
  agentName?: string;
  chatlogPath?: string;
  lastSeenAt?: number;
  lastAcceptedAt?: number;
  lastRejectedAt?: number;
  lastRejectedReason?: string;
  lastRejectedIntervalMs?: number;
  running?: boolean;
  state?: string;
}

export interface TransportistaTrip {
  id: string;
  agentId?: string;
  agentName?: string;
  completedAt: number;
  destination: string;
  durationMs: number;
  loadedAt?: number;
  origin: string;
  source?: string;
  startedAt: number;
  validDuration?: boolean;
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
  const [agents, setAgents] = useState<TransportistaAgentStatus[]>([]);
  const [trips, setTrips] = useState<TransportistaTrip[]>([]);
  const [legacyStatus, setLegacyStatus] = useState<TransportistaAgentStatus | null>(null);
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
    const tripsRef = ref(database, `groups/${groupId}/transportista/trips`);

    const unsubscribe = onValue(tripsRef, (snapshot) => {
      const rawTrips = snapshot.val() ?? {};
      const nextTrips = Object.entries(rawTrips)
        .map(([id, value]) => ({
          id,
          ...(value as Omit<TransportistaTrip, "id">),
        }))
        .filter(
          (trip) =>
            typeof trip.startedAt === "number" &&
            typeof trip.durationMs === "number" &&
            typeof trip.origin === "string" &&
            typeof trip.destination === "string"
        )
        .sort((a, b) => a.startedAt - b.startedAt);

      setTrips(nextTrips);
    });

    return () => unsubscribe();
  }, [groupId]);

  useEffect(() => {
    const agentsRef = ref(database, `groups/${groupId}/transportista/agents`);

    const unsubscribe = onValue(agentsRef, (snapshot) => {
      const rawAgents = snapshot.val() ?? {};
      const nextAgents = Object.entries(rawAgents)
        .map(([id, value]) => ({
          id,
          ...(value as TransportistaAgentStatus),
        }))
        .filter((agent) => typeof agent.lastSeenAt === "number")
        .sort((a, b) => (b.lastSeenAt ?? 0) - (a.lastSeenAt ?? 0));

      setAgents(nextAgents);
    });

    return () => unsubscribe();
  }, [groupId]);

  useEffect(() => {
    const statusRef = ref(database, `groups/${groupId}/transportista/status`);

    const unsubscribe = onValue(statusRef, (snapshot) => {
      const status = snapshot.val();
      setLegacyStatus(status && typeof status.lastSeenAt === "number" ? status : null);
    });

    return () => unsubscribe();
  }, [groupId]);

  return useMemo(() => {
    const visibleAgents =
      agents.length > 0 || !legacyStatus
        ? agents
        : [{ ...legacyStatus, agentId: "legacy-status" }];
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
      agents: visibleAgents,
      averageIntervalMs,
      events,
      fallbackIntervalMs: FALLBACK_INTERVAL_MS,
      lastEvent,
      loading,
      maxRealIntervalMs: MAX_REAL_INTERVAL_MS,
      minRealIntervalMs: MIN_REAL_INTERVAL_MS,
      nextCallAt: lastEvent ? lastEvent.calledAt + averageIntervalMs : null,
      realisticIntervalsCount: intervals.length,
      status: visibleAgents[0] ?? null,
      trips,
    };
  }, [agents, events, legacyStatus, loading, trips]);
}
