/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../../context/UserContext";
import RecruitForm from "../../../../components/RecruitForm";

export default function EditProjectPage() {
    const { id } = useParams();
    const { user } = useAuth();
    const router = useRouter();

    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProject() {
            try {
                const res = await fetch(`http://localhost:3001/api/projects/${id}`);
                if (!res.ok) throw new Error("Failed");
                const data = await res.json();

                // Ownership check
                if (user && data.owner?.email !== user.email) {
                    alert("You are not the owner.");
                    router.push("/");
                    return;
                }

                setProject(data);
            } catch (e) {
                console.error(e);
                alert("Error loading project.");
            } finally {
                setLoading(false);
            }
        }
        fetchProject();
    }, [id, user, router]);

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    if (!project) return <div>Project not found</div>;

    return (
        <main className="min-h-screen bg-slate-50">
            <RecruitForm initialData={project} />
        </main>
    );
}
