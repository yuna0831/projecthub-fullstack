"use client";

import React, { useMemo } from "react";

interface AvatarProps {
    name?: string | null;
    id?: string | null; // Used for color seeding
    size?: "sm" | "md" | "lg" | "xl" | "2xl";
    className?: string;
}

export default function Avatar({ name, id, size = "md", className = "" }: AvatarProps) {
    const initial = name ? name.charAt(0).toUpperCase() : "?";

    // Deterministic Pastel Color Generator
    const bgColor = useMemo(() => {
        const seed = id || name || "default";
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            hash = seed.charCodeAt(i) + ((hash << 5) - hash);
        }

        // Generate HSL: Hue (0-360), Saturation (60-80%), Lightness (80-90% for pastel)
        const h = Math.abs(hash) % 360;
        const s = 70 + (Math.abs(hash) % 20); // 70-90%
        const l = 85 + (Math.abs(hash) % 10); // 85-95% (Very light pastel)

        return `hsl(${h}, ${s}%, ${l}%)`;
    }, [id, name]);

    // Size mapping
    const sizeClasses = {
        sm: "w-8 h-8 text-xs",
        md: "w-10 h-10 text-sm",
        lg: "w-14 h-14 text-lg",
        xl: "w-20 h-20 text-2xl",
        "2xl": "w-32 h-32 text-4xl"
    };

    return (
        <div
            className={`rounded-full flex items-center justify-center font-bold text-slate-700 shadow-inner ${sizeClasses[size]} ${className}`}
            style={{ backgroundColor: bgColor }}
            title={name || "User"}
        >
            {initial}
        </div>
    );
}
