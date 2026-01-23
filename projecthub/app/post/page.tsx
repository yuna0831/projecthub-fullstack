"use client";

import ProjectForm from "../../components/RecruitForm";

export default function PostPage() {
  return (
    <main className="min-h-screen p-6 md:p-12 bg-slate-50 flex items-center justify-center">
      <div className="w-full max-w-3xl">
        <ProjectForm />
      </div>
    </main>
  );
}
