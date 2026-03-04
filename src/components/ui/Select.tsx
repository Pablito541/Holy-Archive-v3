import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    options: SelectOption[];
}
export const Select = ({ label, options, className = '', ...props }: SelectProps & { className?: string }) => (
    <div className="mb-5">
        {label && <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2 ml-1">{label}</label>}
        <div className="relative">
            <select
                className={`w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 focus:border-stone-800 dark:focus:border-zinc-500 focus:ring-1 focus:ring-stone-800 dark:focus:ring-zinc-500 outline-none transition-all appearance-none font-medium text-stone-800 dark:text-zinc-100 ${className}`}
                {...props}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                <ArrowLeft className="w-4 h-4 -rotate-90" />
            </div>
        </div>
    </div>
);
