"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut, User } from "firebase/auth";
import { auth, provider, githubProvider } from "../lib/firebase";

interface AuthContextType {
  user: User | null;
  login: (providerName: "google" | "github") => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          await fetch('http://localhost:3001/api/users/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName,
              picture: firebaseUser.photoURL
            })
          });
          console.log("✅ User synced with backend");
        } catch (error) {
          console.error("❌ Failed to sync user:", error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const login = async (providerName: "google" | "github") => {
    try {
      const p = providerName === "github" ? githubProvider : provider;
      await signInWithPopup(auth, p);
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.code === "auth/account-exists-with-different-credential") {
        alert("You have already signed up with the same email using a different provider (e.g., Google). Please sign in with that provider to link accounts.");
      } else {
        alert("Login failed. Please try again.");
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
