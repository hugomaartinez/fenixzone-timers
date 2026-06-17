import { useCallback, useEffect, useRef, useState } from "react";
import { ref, onValue, set } from "firebase/database";
import { database } from "../firebase";

interface TimerData {
  time: number; // Tiempo total en segundos
  isRunning: boolean;
  alertEnabled: boolean;
  startTime?: number; // Marca de tiempo (timestamp) cuando se inició
}

const defaultTimerData: TimerData = {
  time: 0,
  isRunning: false,
  alertEnabled: false,
};

export function useFirebaseTimer(groupId: string, cityName: string, timerName: string) {
  const [timerData, setTimerData] = useState<TimerData>(defaultTimerData);
  const timerDataRef = useRef(timerData);

  useEffect(() => {
    timerDataRef.current = timerData;
  }, [timerData]);

  useEffect(() => {
    const timerRef = ref(database, `groups/${groupId}/timers/${cityName}/${timerName}`);
    const unsubscribe = onValue(timerRef, (snapshot) => {
      const data = snapshot.val();
      setTimerData(data ?? defaultTimerData);
    });

    return () => unsubscribe();
  }, [groupId, cityName, timerName]);

  const updateTimerData = useCallback(
    (newData: Partial<TimerData>) => {
      const timerRef = ref(database, `groups/${groupId}/timers/${cityName}/${timerName}`);

      // Filtrar valores undefined
      const sanitizedData = Object.fromEntries(
        Object.entries({ ...timerDataRef.current, ...newData }).filter(
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          ([_, value]) => value !== undefined
        )
      );

      set(timerRef, sanitizedData);
    },
    [groupId, cityName, timerName]
  );

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (timerData.isRunning && timerData.startTime) {
      interval = setInterval(() => {
        const elapsedTime = Math.floor(
          timerData.startTime ? (Date.now() - timerData.startTime) / 1000 : 0
        );
        updateTimerData({ time: elapsedTime });
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerData.isRunning, timerData.startTime, updateTimerData]);

  const handleStart = () => {
    const startTime = Date.now() - timerData.time * 1000; // Ajustar el inicio según el tiempo ya transcurrido
    updateTimerData({ isRunning: true, startTime });
  };

  const handleStop = () => {
    // Detener el temporizador en Firebase
    updateTimerData({ isRunning: false });

    // También detener el intervalo localmente si es necesario
    //clearInterval(interval);
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
