import "./globals.css";
import { AuthProvider } from "../context/UserContext";
import Navbar from "../components/Navbar";

export const metadata = {
  title: "ProjectHub",
  description: "Collaborate on projects easily",
};

import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-900`}>
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
