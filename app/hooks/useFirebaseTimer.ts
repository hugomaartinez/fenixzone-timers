import { useState, useEffect } from "react";
import { ref, onValue, set } from "firebase/database";
import { database } from "../firebase";

interface TimerData {
  time: number; // Tiempo total en segundos
  isRunning: boolean;
  alertEnabled: boolean;
  startTime?: number; // Marca de tiempo (timestamp) cuando se inició
}

export function useFirebaseTimer(cityName: string, timerName: string) {
  const [timerData, setTimerData] = useState<TimerData>({
    time: 0,
    isRunning: false,
    alertEnabled: false,
  });

  useEffect(() => {
    const timerRef = ref(database, `timers/${cityName}/${timerName}`);
    const unsubscribe = onValue(timerRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setTimerData(data);
      }
    });

    return () => unsubscribe();
  }, [cityName, timerName]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (timerData.isRunning && timerData.startTime) {
      interval = setInterval(() => {
        const elapsedTime = Math.floor(
          (Date.now() - timerData?.startTime) / 1000
        );
        updateTimerData({ time: elapsedTime });
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerData.isRunning, timerData.startTime]);

  const updateTimerData = (newData: Partial<TimerData>) => {
    const timerRef = ref(database, `timers/${cityName}/${timerName}`);

    // Filtrar valores undefined
    const sanitizedData = Object.fromEntries(
      Object.entries({ ...timerData, ...newData }).filter(
        ([_, value]) => value !== undefined
      )
    );

    set(timerRef, sanitizedData);
  };

  const handleStart = () => {
    const startTime = Date.now() - timerData.time * 1000; // Ajustar el inicio según el tiempo ya transcurrido
    updateTimerData({ isRunning: true, startTime });
  };

  const handleStop = () => {
    // Detener el temporizador en Firebase
    updateTimerData({ isRunning: false });

    // También detener el intervalo localmente si es necesario
    clearInterval(interval);
  };

  const handleReset = () =>
    updateTimerData({ time: 0, isRunning: false, startTime: undefined });
  const toggleAlert = () =>
    updateTimerData({ alertEnabled: !timerData.alertEnabled });

  return {
    ...timerData,
    handleStart,
    handleStop,
    handleReset,
    toggleAlert,
  };
}
