'use client';

import React from 'react';

interface PasswordStrengthProps {
    password: string;
}

function getStrength(password: string): { level: number; label: string; color: string } {
    if (!password) return { level: 0, label: '', color: '' };

    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { level: 1, label: 'Schwach', color: 'bg-red-500' };
    if (score <= 3) return { level: 2, label: 'Mittel', color: 'bg-amber-500' };
    return { level: 3, label: 'Stark', color: 'bg-emerald-500' };
}

export const PasswordStrength = ({ password }: PasswordStrengthProps) => {
    const { level, label, color } = getStrength(password);

    if (!password) return null;

    return (
        <div className="mt-2 space-y-1.5">
            <div className="flex gap-1.5">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            i <= level ? color : 'bg-stone-200 dark:bg-zinc-700'
                        }`}
                    />
                ))}
            </div>
            <p className={`text-xs font-medium ${
                level === 1 ? 'text-red-600' : level === 2 ? 'text-amber-600' : 'text-emerald-600'
            }`}>
                {label}
            </p>
        </div>
    );
};
