"use client";

import { FormEvent, useState } from "react";
import {
  ChevronDownIcon,
  Gamepad2Icon,
  LockIcon,
  LogInIcon,
  MailIcon,
  ServerIcon,
  UserIcon,
  UserPlusIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AuthPanelProps {
  onLogin: (email: string, password: string) => Promise<unknown>;
  onRegister: (
    email: string,
    password: string,
    playerName: string,
    server: string
  ) => Promise<unknown>;
}

export default function AuthPanel({ onLogin, onRegister }: AuthPanelProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [server, setServer] = useState("Roleplay 1");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isRegister = mode === "register";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        await onRegister(email, password, playerName, server);
      } else {
        await onLogin(email, password);
      }
    } catch (authError) {
      const message =
        authError instanceof Error
          ? authError.message
          : "No se pudo completar la autenticación.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (nextMode: "login" | "register") => {
    setMode(nextMode);
    setError(null);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.14),_transparent_32%),linear-gradient(135deg,_hsl(0_0%_3.9%),_hsl(220_18%_8%)_52%,_hsl(0_0%_3.9%))] p-4">
      <div className="grid w-full max-w-4xl gap-5 lg:grid-cols-[1fr_420px] lg:items-center">
        <section className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-muted-foreground">
            <Gamepad2Icon className="h-4 w-4 text-teal-300" />
            Registro y acceso para tus tiempos compartidos
          </div>
          <div className="space-y-2">
            <h1 className="max-w-xl text-4xl font-bold leading-tight sm:text-5xl">
              {isRegister ? "Crear cuenta" : "Entrar"}
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground">
              {isRegister
                ? "Aquí solo pedimos lo necesario: email, contraseña, nick y servidor."
                : "Usa tu cuenta para abrir tus grupos y temporizadores."}
            </p>
          </div>
        </section>

        <Card className="w-full rounded-lg border-white/10 bg-card/90 shadow-2xl shadow-black/30 backdrop-blur">
          <CardHeader>
            <div className="mb-4 grid grid-cols-2 rounded-lg border border-white/10 bg-background p-1">
              <button
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  !isRegister
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                type="button"
                onClick={() => switchMode("login")}
              >
                Entrar
              </button>
              <button
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isRegister
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                type="button"
                onClick={() => switchMode("register")}
              >
                Registro
              </button>
            </div>
            <CardTitle>{isRegister ? "Crear cuenta" : "Entrar"}</CardTitle>
            <CardDescription>
              {isRegister
                ? "Completa tus datos de jugador antes de entrar al grupo."
                : "Accede rápido a tus grupos compartidos."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="block space-y-2 text-sm font-medium">
                <span>Email</span>
                <span className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2">
                  <MailIcon className="h-4 w-4 text-muted-foreground" />
                  <input
                    className="w-full bg-transparent outline-none"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    required
                  />
                </span>
              </label>

              {isRegister ? (
                <div className="space-y-4 rounded-lg border border-amber-300/20 bg-amber-300/[0.04] p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Gamepad2Icon className="h-4 w-4 text-amber-300" />
                    Perfil dentro del juego
                  </div>
                  <label className="block space-y-2 text-sm font-medium">
                    <span>Nombre dentro del juego</span>
                    <span className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2">
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                      <input
                        className="w-full bg-transparent outline-none"
                        type="text"
                        value={playerName}
                        onChange={(event) => setPlayerName(event.target.value)}
                        autoComplete="nickname"
                        placeholder="Ej: Hugo_Stone"
                        required
                      />
                    </span>
                  </label>
                  <label className="block space-y-2 text-sm font-medium">
                    <span>Servidor de FenixZone</span>
                    <span className="relative flex items-center rounded-md border border-input bg-background px-3 py-2 pr-10">
                      <ServerIcon className="h-4 w-4 text-muted-foreground" />
                      <select
                        className="w-full appearance-none bg-transparent pr-2 outline-none"
                        value={server}
                        onChange={(event) => setServer(event.target.value)}
                        required
                      >
                        <option>Roleplay 1</option>
                        <option>Roleplay 2</option>
                        <option>Roleplay 3</option>
                        <option>Roleplay 4</option>
                        <option>DM / Freeroam</option>
                      </select>
                      <ChevronDownIcon className="pointer-events-none absolute right-3 h-4 w-4 text-muted-foreground" />
                    </span>
                  </label>
                </div>
              ) : null}

              <label className="block space-y-2 text-sm font-medium">
                <span>Contraseña</span>
                <span className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2">
                  <LockIcon className="h-4 w-4 text-muted-foreground" />
                  <input
                    className="w-full bg-transparent outline-none"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete={isRegister ? "new-password" : "current-password"}
                    minLength={6}
                    required
                  />
                </span>
              </label>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button className="w-full" type="submit" disabled={loading}>
                {isRegister ? (
                  <UserPlusIcon className="h-4 w-4" />
                ) : (
                  <LogInIcon className="h-4 w-4" />
                )}
                {loading ? "Cargando..." : isRegister ? "Crear cuenta" : "Entrar"}
              </Button>
            </form>
            <Button
              className="mt-3 w-full"
              type="button"
              variant="ghost"
              onClick={() => switchMode(isRegister ? "login" : "register")}
            >
              {isRegister ? "Volver al inicio de sesión" : "Crear una cuenta nueva"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
