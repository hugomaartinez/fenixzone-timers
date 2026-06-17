"use client";

import { useEffect, useState } from "react";
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { onValue, ref, set } from "firebase/database";
import { auth } from "@/app/firebase";
import { database } from "@/app/firebase";

export interface UserProfile {
  email: string | null;
  playerName: string;
  server: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    const profileRef = ref(database, `users/${user.uid}`);
    const unsubscribe = onValue(profileRef, (snapshot) => {
      setProfile(snapshot.val());
    });

    return () => unsubscribe();
  }, [user]);

  const login = (email: string, password: string) =>
    signInWithEmailAndPassword(auth, email, password);

  const register = async (
    email: string,
    password: string,
    playerName: string,
    server: string
  ) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const trimmedPlayerName = playerName.trim();
    const trimmedServer = server.trim();

    await updateProfile(credential.user, {
      displayName: trimmedPlayerName,
    });
    await set(ref(database, `users/${credential.user.uid}`), {
      email,
      playerName: trimmedPlayerName,
      server: trimmedServer,
      createdAt: Date.now(),
    });

    return credential;
  };

  const logout = () => signOut(auth);

  return { user, profile, loading, login, register, logout };
}
