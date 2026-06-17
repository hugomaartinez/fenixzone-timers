"use client";

import { useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  PlayIcon,
  MonitorStopIcon as StopIcon,
  RotateCcwIcon,
  BellIcon,
  TimerIcon,
} from "lucide-react";
import { useFirebaseTimer } from "@/app/hooks/useFirebaseTimer";
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
    handleStop,
    handleReset,
    toggleAlert,
  } = useFirebaseTimer(groupId, cityName, title);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio("/notification_sound.wav");
  }, []);

  useEffect(() => {
    if (time === 35 * 60 && alertEnabled && audioRef.current) {
      audioRef.current.play();
    }
  }, [time, alertEnabled]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
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
      </CardContent>
      <CardFooter className="justify-center gap-2 p-4 pt-0">
        <Button onClick={handleStart} disabled={isRunning}>
          <PlayIcon className="h-4 w-4 md:h-5 md:w-5" />
          <span className="hidden min-[1280px]:inline-block ml-2">Iniciar</span>
        </Button>
        <Button onClick={handleStop} disabled={!isRunning}>
          <StopIcon className="h-4 w-4 md:h-5 md:w-5" />
          <span className="hidden min-[1280px]:inline-block ml-2">Parar</span>
        </Button>
        <Button onClick={handleReset} variant="outline">
          <RotateCcwIcon className="h-4 w-4 md:h-5 md:w-5" />
          <span className="hidden min-[1280px]:inline-block ml-2">
            Reiniciar
          </span>
        </Button>
      </CardFooter>
    </Card>
  );
}
