"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BellIcon,
  Clock3Icon,
  Edit3Icon,
  MonitorStopIcon as StopIcon,
  PlayIcon,
  RotateCcwIcon,
  TimerIcon,
  SaveIcon,
} from "lucide-react";
import { useFirebaseTimer } from "@/app/hooks/useFirebaseTimer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface TimerProps {
  title: string;
  cityName: string;
  groupId: string;
}

export default function Timer({ title, cityName, groupId }: TimerProps) {
  const {
    time,
    isRunning,
    alertEnabled,
    handleStart,
    handleStartFrom,
    handleStop,
    handleReset,
    handleSetTime,
    toggleAlert,
  } = useFirebaseTimer(groupId, cityName, title);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draftMinutes, setDraftMinutes] = useState("");

  useEffect(() => {
    audioRef.current = new Audio("/notification_sound.wav");
  }, []);

  useEffect(() => {
    if (time === 35 * 60 && alertEnabled && audioRef.current) {
      audioRef.current.play();
    }
  }, [time, alertEnabled]);

  useEffect(() => {
    if (isEditing) {
      setDraftMinutes(String(Math.floor(time / 60)));
    }
  }, [isEditing, time]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const editableSeconds = useMemo(() => {
    const minutes = Number(draftMinutes);
    if (Number.isNaN(minutes) || minutes < 0) {
      return 0;
    }

    return Math.floor(minutes * 60);
  }, [draftMinutes]);

  const applyTime = () => {
    handleSetTime(editableSeconds);
    setIsEditing(false);
  };

  const startFromEditedTime = () => {
    handleStartFrom(editableSeconds);
    setIsEditing(false);
  };

  return (
    <Card
      className={cn(
        "overflow-hidden rounded-lg border-white/10 bg-card shadow-lg shadow-black/20 transition-colors",
        isRunning ? "ring-1 ring-teal-400/40" : ""
      )}
    >
      <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-white/10 bg-white/[0.03] p-4">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">{cityName}</p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs",
            isRunning
              ? "bg-teal-400/10 text-teal-300"
              : "bg-muted text-muted-foreground"
          )}
        >
          <TimerIcon className="h-3.5 w-3.5" />
          {isRunning ? "Activo" : "Pausado"}
        </span>
      </CardHeader>
      <CardContent className="p-5">
        <p className="text-center font-mono text-4xl font-bold tabular-nums tracking-normal">
          {formatTime(time)}
        </p>
        <div className="mt-5 flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-background px-3 py-2">
          <BellIcon className="h-4 w-4 text-amber-300" />
          <Switch
            checked={alertEnabled}
            onCheckedChange={toggleAlert}
            aria-label="Activar alerta a los 35 minutos"
          />
          <span className="text-sm text-muted-foreground">Alerta a los 35 min</span>
        </div>

        <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock3Icon className="h-4 w-4" />
              Ajustar tiempo
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing((value) => !value)}
            >
              <Edit3Icon className="h-4 w-4" />
              {isEditing ? "Cerrar" : "Editar"}
            </Button>
          </div>

          {isEditing ? (
            <div className="mt-3 grid gap-3">
              <label className="grid gap-1 text-sm">
                <span className="text-muted-foreground">Minutos</span>
                <input
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  type="number"
                  min="0"
                  step="1"
                  value={draftMinutes}
                  onChange={(event) => setDraftMinutes(event.target.value)}
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  className="h-9 px-3"
                  type="button"
                  variant="outline"
                  onClick={applyTime}
                >
                  <SaveIcon className="h-4 w-4" />
                  Aplicar
                </Button>
                <Button
                  className="h-9 px-3"
                  type="button"
                  onClick={startFromEditedTime}
                >
                  <PlayIcon className="h-4 w-4" />
                  Iniciar
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </CardContent>
      <CardFooter className="justify-center gap-2 p-4 pt-0">
        <Button onClick={handleStart} disabled={isRunning}>
          <PlayIcon className="h-4 w-4 md:h-5 md:w-5" />
          <span className="ml-2 hidden min-[1280px]:inline-block">Iniciar</span>
        </Button>
        <Button onClick={handleStop} disabled={!isRunning}>
          <StopIcon className="h-4 w-4 md:h-5 md:w-5" />
          <span className="ml-2 hidden min-[1280px]:inline-block">Parar</span>
        </Button>
        <Button onClick={handleReset} variant="outline">
          <RotateCcwIcon className="h-4 w-4 md:h-5 md:w-5" />
          <span className="ml-2 hidden min-[1280px]:inline-block">Reiniciar</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
