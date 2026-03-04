"use client";

import React, { useMemo } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

export const SalesChart = ({ serverData, months = 12, type = 'revenue' }: { serverData?: any[], months?: number, type?: 'profit' | 'revenue' }) => {
    const chartData = useMemo(() => {
        if (!serverData || serverData.length === 0) return [];
        return serverData.slice(-months);
    }, [serverData, months]);

    if (!chartData || chartData.length === 0) {
        return <div className="w-full h-64 flex items-center justify-center text-stone-400">Keine Daten verfügbar</div>;
    }

    const formatCurrency = (value: number) => {
        return value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-zinc-900 border border-stone-100 dark:border-zinc-800 p-3 rounded-xl shadow-lg">
                    <p className="font-bold text-stone-900 dark:text-zinc-50 mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex justify-between items-center gap-4 text-sm">
                            <span style={{ color: entry.color }} className="font-medium">{entry.name}:</span>
                            <span className="font-bold text-stone-700 dark:text-zinc-300">{formatCurrency(entry.value)}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full h-80 pt-4">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-zinc-800" opacity={0.5} />
                    <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                        width={40}
                    />
                    <Tooltip content={<CustomTooltip />} />

                    {type === 'revenue' ? (
                        <>
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                name="Einnahmen"
                                stroke="#10b981"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorRevenue)"
                                activeDot={{ r: 6, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }}
                            />
                            <Area
                                type="monotone"
                                dataKey="expenses"
                                name="Ausgaben"
                                stroke="#ef4444"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorExpenses)"
                                activeDot={{ r: 6, fill: "#ef4444", stroke: "#fff", strokeWidth: 2 }}
                            />
                        </>
                    ) : (
                        <Area
                            type="monotone"
                            dataKey="net_profit"
                            name="Reingewinn"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorProfit)"
                            activeDot={{ r: 6, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
                        />
                    )}
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

