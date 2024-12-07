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
} from "lucide-react";
import { useFirebaseTimer } from "@/app/hooks/useFirebaseTimer";

interface TimerProps {
  title: string;
  cityName: string;
}

export default function Timer({ title, cityName }: TimerProps) {
  const {
    time,
    isRunning,
    alertEnabled,
    handleStart,
    handleStop,
    handleReset,
    toggleAlert,
  } = useFirebaseTimer(cityName, title);
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
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-center">{formatTime(time)}</p>
        <div className="flex items-center justify-center space-x-2 mt-4">
          <BellIcon className="h-4 w-4" />
          <Switch
            checked={alertEnabled}
            onCheckedChange={toggleAlert}
            aria-label="Activar alerta a los 35 minutos"
          />
          <span className="text-sm">Alerta a los 35 min</span>
        </div>
      </CardContent>
      <CardFooter className="justify-center space-x-2">
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
