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
  loading: boolean; // 🆕
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // 🆕

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Enforce @wisc.edu domain rigidly
        if (!firebaseUser.email?.toLowerCase().endsWith("@wisc.edu")) {
          alert("Please use your UW-Madison email.");
          await signOut(auth);
          setUser(null);
          setLoading(false);
          return;
        }

        // Require email verification before allowing login or backend sync
        if (!firebaseUser.emailVerified) {
          // Keep checking every 3 seconds while user is not verified
          const verificationInterval = setInterval(async () => {
            await firebaseUser.reload();
            if (firebaseUser.emailVerified) {
              clearInterval(verificationInterval);
              // Wait a bit to ensure UI reflects before firing the rest of the flow...
              setTimeout(() => {
                // To trigger a re-render and re-run onAuthStateChanged 
                // We'll update state directly or just manually continue the flow
                setUser(firebaseUser);
                syncUserWithBackend(firebaseUser); // abstracting the fetch out
              }, 500);
            }
          }, 3000);

          // Return early. User state is null while polling.
          setUser(null);
          setLoading(false);
          return;
        }

        setUser(firebaseUser);
        await syncUserWithBackend(firebaseUser);

      } else {
        setUser(null);
        setLoading(false); // 🆕
      }
    });

    const syncUserWithBackend = async (firebaseUser: User) => {
      try {
        const token = await firebaseUser.getIdToken();
        const res = await fetch('http://localhost:3001/api/users/sync', {
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

        if (!res.ok) {
          const errData = await res.json();
          if (res.status === 403 || res.status === 401) {
            console.error("Access Denied:", errData.error);
            alert(errData.error || "Access Denied");
            await signOut(auth);
            return;
          }
          console.error("Sync failed:", errData);
        } else {
          console.log("✅ User synced with backend");
        }
      } catch (error) {
        console.error("❌ Failed to sync user:", error);
      } finally {
        setLoading(false); // ensure loading flips to false
      }
    };
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

      // Post-login checks: REMOVED strict frontend check to allow legacy users.
      // Backend 'syncUser' will validate/block based on DB existence.

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
    if (!email.toLowerCase().endsWith("@wisc.edu")) {
      throw new Error("Only @wisc.edu emails are allowed.");
    }

    try {
      const res = await signInWithEmailAndPassword(auth, email, pass);
      if (!res.user.emailVerified) {
        throw new Error("⚠️ Please verify your email to continue. Check your inbox for a verification link.");
      }
    } catch (error: any) {
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        throw new Error("Invalid email or password. Please sign up if you don't have an account.");
      }
      throw error;
    }
  };

  const signupWithEmail = async (email: string, pass: string, name: string) => {
    if (!email.toLowerCase().endsWith("@wisc.edu")) {
      throw new Error("Only @wisc.edu emails are allowed.");
    }

    const res = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(res.user, { displayName: name });
    await sendEmailVerification(res.user);

    // No alert here, handled by UI
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loginWithEmail, signupWithEmail, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
