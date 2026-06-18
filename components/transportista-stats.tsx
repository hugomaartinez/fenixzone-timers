"use client";

import { BarChart3Icon, MapPinIcon, TimerIcon } from "lucide-react";
import type { TransportistaTrip } from "@/app/hooks/useTransportista";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MAX_TRIP_DURATION_MS = 10 * 60 * 1000;

interface TransportistaStatsProps {
  trips: TransportistaTrip[];
}

interface LocationStats {
  averageDurationMs: number | null;
  completedCount: number;
  count: number;
  location: string;
}

function formatDuration(milliseconds: number) {
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function isValidCompletedTrip(trip: TransportistaTrip) {
  return (
    typeof trip.durationMs === "number" &&
    trip.durationMs > 0 &&
    trip.durationMs <= MAX_TRIP_DURATION_MS &&
    trip.validDuration !== false
  );
}

function getLocationStats(trips: TransportistaTrip[]) {
  const locations = new Map<
    string,
    { completedCount: number; count: number; durationMs: number }
  >();

  trips.forEach((trip) => {
    const current = locations.get(trip.origin) ?? {
      completedCount: 0,
      count: 0,
      durationMs: 0,
    };
    current.count += 1;
    if (isValidCompletedTrip(trip)) {
      current.completedCount += 1;
      current.durationMs += trip.durationMs ?? 0;
    }
    locations.set(trip.origin, current);
  });

  return [...locations.entries()]
    .map<LocationStats>(([location, stats]) => ({
      averageDurationMs:
        stats.completedCount > 0
          ? Math.round(stats.durationMs / stats.completedCount)
          : null,
      completedCount: stats.completedCount,
      count: stats.count,
      location,
    }))
    .sort((a, b) => b.count - a.count || a.location.localeCompare(b.location));
}

function LocationName({ location }: { location: string }) {
  return <p className="min-w-0 truncate text-sm font-medium">{location}</p>;
}

export default function TransportistaStats({ trips }: TransportistaStatsProps) {
  const locations = getLocationStats(trips);
  const completedTripsCount = trips.filter(isValidCompletedTrip).length;
  const locationsByDuration = locations
    .filter(
      (location): location is LocationStats & { averageDurationMs: number } =>
        location.averageDurationMs !== null
    )
    .sort((a, b) => a.averageDurationMs - b.averageDurationMs);

  return (
    <Card className="overflow-hidden rounded-lg border-white/10 bg-card shadow-lg shadow-black/20 lg:col-span-2">
      <CardHeader className="flex-col items-start justify-between gap-3 space-y-0 border-b border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3Icon className="h-5 w-5 text-teal-300" />
            Estadísticas de recorridos
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Los porcentajes cuentan encargos atendidos; las medias, entregas de hasta 10 minutos
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-md bg-white/[0.06] px-2 py-1 text-xs text-muted-foreground">
            {trips.length} asignado{trips.length === 1 ? "" : "s"}
          </span>
          <span className="rounded-md bg-teal-400/10 px-2 py-1 text-xs text-teal-300">
            {completedTripsCount} completado{completedTripsCount === 1 ? "" : "s"}
          </span>
        </div>
      </CardHeader>

      {locations.length === 0 ? (
        <CardContent className="p-5">
          <p className="text-sm text-muted-foreground">
            Aún no hay encargos registrados. Las estadísticas aparecerán al atender una llamada de transportista.
          </p>
        </CardContent>
      ) : (
        <CardContent className="grid gap-6 p-5 lg:grid-cols-2">
          <section>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <MapPinIcon className="h-4 w-4 text-amber-300" />
              Distribución de encargos
            </h3>
            <div className="space-y-4">
              {locations.slice(0, 8).map((location) => {
                const percentage = (location.count / trips.length) * 100;
                return (
                  <div key={location.location}>
                    <div className="mb-2 flex items-end justify-between gap-3">
                      <LocationName location={location.location} />
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {percentage.toLocaleString("es-ES", {
                          maximumFractionDigits: 1,
                        })}
                        % · {location.count}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full bg-teal-400"
                        style={{ width: `${Math.max(3, percentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <TimerIcon className="h-4 w-4 text-emerald-300" />
              Duración media por ubicación
            </h3>
            <div className="divide-y divide-white/10 rounded-md border border-white/10 bg-background">
              {locationsByDuration.slice(0, 8).map((location) => (
                <div
                  className="flex items-center justify-between gap-4 px-3 py-3"
                  key={location.location}
                >
                  <LocationName location={location.location} />
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-sm font-semibold tabular-nums text-emerald-300">
                      {formatDuration(location.averageDurationMs)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {location.completedCount} entrega{location.completedCount === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
              ))}
              {locationsByDuration.length === 0 ? (
                <p className="px-3 py-4 text-sm text-muted-foreground">
                  Todavía no hay entregas válidas para calcular medias.
                </p>
              ) : null}
            </div>
          </section>
        </CardContent>
      )}
    </Card>
  );
}
