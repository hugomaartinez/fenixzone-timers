"use client";

import { FormEvent, useState } from "react";
import { MailIcon, LockIcon, LogInIcon, UserPlusIcon } from "lucide-react";
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
  onRegister: (email: string, password: string) => Promise<unknown>;
}

export default function AuthPanel({ onLogin, onRegister }: AuthPanelProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "login") {
        await onLogin(email, password);
      } else {
        await onRegister(email, password);
      }
    } catch (authError) {
      const message =
        authError instanceof Error
          ? authError.message
          : "No se pudo completar la autenticacion.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center p-4">
      <Card className="w-full rounded-lg">
        <CardHeader>
          <CardTitle>FenixZone Timers</CardTitle>
          <CardDescription>
            Entra para compartir los tiempos de las casas con tu grupo.
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
            <label className="block space-y-2 text-sm font-medium">
              <span>Contrasena</span>
              <span className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2">
                <LockIcon className="h-4 w-4 text-muted-foreground" />
                <input
                  className="w-full bg-transparent outline-none"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  minLength={6}
                  required
                />
              </span>
            </label>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button className="w-full" type="submit" disabled={loading}>
              {mode === "login" ? (
                <LogInIcon className="h-4 w-4" />
              ) : (
                <UserPlusIcon className="h-4 w-4" />
              )}
              {loading ? "Cargando..." : mode === "login" ? "Entrar" : "Crear cuenta"}
            </Button>
          </form>
          <Button
            className="mt-3 w-full"
            type="button"
            variant="ghost"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError(null);
            }}
          >
            {mode === "login" ? "Crear una cuenta nueva" : "Ya tengo cuenta"}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
