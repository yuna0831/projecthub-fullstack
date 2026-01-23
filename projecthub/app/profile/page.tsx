"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "../../context/UserContext";
import { useEffect, useState } from "react";
import { getAllProjects } from "../../lib/firestore";

export default function ProfilePage() {
  const { user } = useAuth();
  const [myProjects, setMyProjects] = useState<any[]>([]);

  useEffect(() => {
    async function fetchMyProjects() {
      if (!user) return;
      const all = await getAllProjects();

      const mine = all.filter((p) => p.createdByEmail === user.email);
      console.log("My projects:", mine);

      setMyProjects(mine);
    }
    fetchMyProjects();
  }, [user]);

  if (!user) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-gray-600">Please sign in first.</p>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded shadow">
      {/* User Info */}
      <div className="flex items-center gap-6 mb-10 pb-10 border-b border-slate-100">
        {user.photoURL ? (
          <Image
            src={user.photoURL}
            alt="Profile photo"
            width={80}
            height={80}
            className="rounded-full shadow-md border-2 border-white"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center text-3xl">👤</div>
        )}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{user.displayName}</h1>
          <p className="text-slate-500 font-medium">{user.email}</p>
        </div>
      </div>

      {/* My Projects */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">My Projects</h2>
        <Link href="/post" className="text-blue-600 hover:underline text-sm font-medium">
          + Create New
        </Link>
      </div>

      {myProjects.length === 0 ? (
        <div className="text-center py-10 bg-slate-50 rounded-lg border border-slate-100 border-dashed">
          <p className="text-slate-500 mb-2">You haven’t posted any projects yet.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {myProjects.map((p) => (
            <li
              key={p.id}
              className="group border border-slate-200 p-5 rounded-xl bg-white shadow-sm hover:border-blue-300 hover:shadow-md transition-all duration-200"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">{p.title}</h3>
                  <p className="text-slate-500 text-sm line-clamp-2 mb-3">{p.description}</p>
                </div>
                {p.useApply && <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded uppercase font-bold tracking-wide">Recruiting</span>}
              </div>

              <div className="flex gap-4 mt-2 pt-3 border-t border-slate-50">
                {/* View details */}
                <Link
                  href={`/project/${p.id}`}
                  className="text-slate-600 hover:text-blue-600 text-sm font-medium flex items-center gap-1 transition"
                >
                  View Details
                </Link>

                {/* View applicants */}
                {p.useApply && (
                  <Link
                    href={`/project/${p.id}/applicants`}
                    className="text-slate-600 hover:text-green-600 text-sm font-medium flex items-center gap-1 transition"
                  >
                    View Applicants
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
