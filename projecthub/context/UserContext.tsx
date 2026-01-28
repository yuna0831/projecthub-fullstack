"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut, User, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, updateProfile } from "firebase/auth";
import { auth, provider, githubProvider } from "../lib/firebase";

interface AuthContextType {
  user: User | null;
  login: (providerName: "google" | "github") => void;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // 🛡️ Security Check
        const email = firebaseUser.email || "";
        const isDev = process.env.NODE_ENV === 'development';
        if (!isDev && !email.endsWith("@wisc.edu")) {
          alert("Access Denied: Only @wisc.edu emails are allowed. Please sign in with your university account.");
          await signOut(auth);
          return;
        }

        // Email Verification Check (Optional: Enforce here or just warn? User said "deny key features". 
        // But also said "Login is allowed but features blocked". 
        // Wait, User Request: "로그인은 되더라도 모든 주요 기능... 차단" (Login ok, block features).
        // BUT also: "Please verify... alert".
        // If I block features, I should keep them logged in but maybe strict mode? 
        // Actually, the backend blocks features. Frontend should warn.
        // Let's keep them logged in but show warning if not verified.
        if (!firebaseUser.emailVerified) {
          // We'll trigger a recurring warning or just set a state? 
          // For now, let's just alert once.
          // NOTE: Firebase `emailVerified` might be delayed.
        }

        setUser(firebaseUser);

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
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const login = async (providerName: "google" | "github") => {
    try {
      // 🛡️ User requested to prioritize Google or remove GitHub for Wisc auth.
      if (providerName === "github") {
        alert("GitHub login is restricted. Please use Google Login with your @wisc.edu account.");
        return;
      }

      const p = provider; // Default to Google
      const result = await signInWithPopup(auth, p);
      const user = result.user;

      // Post-login checks
      const isDev = process.env.NODE_ENV === 'development';
      if (!isDev && !user.email?.endsWith("@wisc.edu")) {
        await signOut(auth);
        throw new Error("Only @wisc.edu emails are allowed.");
      }

      if (!user.emailVerified) {
        alert("⚠️ Your email is not verified! You may browse, but you cannot apply or post until you verify your email via your wisc.edu inbox.");
      }

    } catch (error: any) {
      console.error("Login error:", error);
      if (error.code === "auth/account-exists-with-different-credential") {
        alert("You have already signed up with the same email using a different provider. Please use that provider.");
      } else if (error.message.includes("Only @wisc.edu")) {
        alert(error.message);
      } else {
        alert("Login failed.");
      }
    }
  };


  const loginWithEmail = async (email: string, pass: string) => {
    const isDev = process.env.NODE_ENV === 'development';
    if (!isDev && !email.endsWith("@wisc.edu")) throw new Error("Only @wisc.edu emails are allowed.");

    try {
      const res = await signInWithEmailAndPassword(auth, email, pass);
      if (!res.user.emailVerified) {
        alert("⚠️ Your email is not verified! Please check your inbox.");
      }
    } catch (error: any) {
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        throw new Error("Invalid email or password. Please sign up if you don't have an account.");
      }
      throw error;
    }
  };

  const signupWithEmail = async (email: string, pass: string, name: string) => {
    const isDev = process.env.NODE_ENV === 'development';
    if (!isDev && !email.endsWith("@wisc.edu")) throw new Error("Only @wisc.edu emails are allowed.");

    const res = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(res.user, { displayName: name });
    await sendEmailVerification(res.user);

    alert(`Verification email sent to ${email}. Please verify before applying.`);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loginWithEmail, signupWithEmail }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
