'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Filter, ChevronLeft, ChevronRight, Clock, User, Package, Wallet, Shield, Settings, RefreshCw } from 'lucide-react';
import { FadeIn } from '../ui/FadeIn';
import { Card } from '../ui/Card';
import { supabase } from '../../lib/supabase';
import { captureException } from '../../lib/errorTracking';

interface AuditLogEntry {
    id: string;
    organization_id: string;
    user_id: string;
    action: string;
    entity_type: string;
    entity_id: string | null;
    changes: Record<string, { old: unknown; new: unknown }> | null;
    metadata: Record<string, unknown> | null;
    created_at: string;
    // Joined
    user_email?: string;
}

const ACTION_LABELS: Record<string, string> = {
    create: 'Erstellt',
    update: 'Aktualisiert',
    delete: 'Gelöscht',
    sell: 'Verkauft',
    login: 'Angemeldet',
    invite_member: 'Eingeladen',
};

const ENTITY_LABELS: Record<string, string> = {
    items: 'Artikel',
    expenses: 'Ausgabe',
    item_certificates: 'Zertifikat',
    certificate_sales: 'Zertifikatsverkauf',
    member: 'Mitglied',
    settings: 'Einstellungen',
};

const ACTION_COLORS: Record<string, string> = {
    create: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    update: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    delete: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    sell: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

const ENTITY_ICONS: Record<string, React.ReactNode> = {
    items: <Package className="w-4 h-4" />,
    expenses: <Wallet className="w-4 h-4" />,
    item_certificates: <Shield className="w-4 h-4" />,
    certificate_sales: <Shield className="w-4 h-4" />,
    member: <User className="w-4 h-4" />,
    settings: <Settings className="w-4 h-4" />,
};

const PAGE_SIZE = 50;

interface AuditLogViewProps {
    currentOrgId: string | null;
    onBack: () => void;
}

export const AuditLogView = ({ currentOrgId, onBack }: AuditLogViewProps) => {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [showFilters, setShowFilters] = useState(false);

    // Filters
    const [filterAction, setFilterAction] = useState('');
    const [filterEntityType, setFilterEntityType] = useState('');

    const fetchLogs = useCallback(async () => {
        if (!currentOrgId || !supabase) return;
        setIsLoading(true);
        try {
            let query = supabase
                .from('audit_logs')
                .select('*', { count: 'exact' })
                .eq('organization_id', currentOrgId)
                .order('created_at', { ascending: false })
                .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

            if (filterAction) query = query.eq('action', filterAction);
            if (filterEntityType) query = query.eq('entity_type', filterEntityType);

            const { data, error, count } = await query;
            if (error) throw error;
            setLogs((data as AuditLogEntry[]) || []);
            setTotalCount(count || 0);
        } catch (error) {
            captureException(error instanceof Error ? error : new Error(String(error)), { context: 'fetchAuditLogs' });
        } finally {
            setIsLoading(false);
        }
    }, [currentOrgId, page, filterAction, filterEntityType]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    };

    const formatRelativeTime = (dateStr: string) => {
        const now = new Date();
        const d = new Date(dateStr);
        const diffMs = now.getTime() - d.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMin < 1) return 'Gerade eben';
        if (diffMin < 60) return `vor ${diffMin} Min.`;
        if (diffHours < 24) return `vor ${diffHours} Std.`;
        if (diffDays < 7) return `vor ${diffDays} Tag${diffDays > 1 ? 'en' : ''}`;
        return formatDate(dateStr);
    };

    const renderChanges = (changes: Record<string, { old: unknown; new: unknown }> | null, action: string) => {
        if (!changes || action === 'create' || action === 'delete') return null;

        const entries = Object.entries(changes).filter(([key]) =>
            !['id', 'organization_id', 'created_at', 'updated_at', 'deleted_at'].includes(key)
        ).slice(0, 5);

        if (entries.length === 0) return null;

        return (
            <div className="mt-2 space-y-1">
                {entries.map(([key, val]) => (
                    <div key={key} className="text-xs text-stone-500 dark:text-zinc-400 flex items-center gap-1 flex-wrap">
                        <span className="font-medium text-stone-600 dark:text-zinc-300">{key}:</span>
                        <span className="line-through text-red-400">{String(val.old ?? '–')}</span>
                        <span>→</span>
                        <span className="text-emerald-600 dark:text-emerald-400">{String(val.new ?? '–')}</span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <FadeIn className="min-h-screen bg-[#fafaf9] dark:bg-black pb-32">
            <header className="sticky top-0 z-50 bg-[#fafaf9]/80 dark:bg-black/80 backdrop-blur-xl border-b border-stone-200 dark:border-zinc-800">
                <div className="flex items-center justify-between p-4 max-w-3xl mx-auto">
                    <button
                        onClick={onBack}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 text-stone-600 dark:text-zinc-400"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="font-serif font-bold text-lg text-stone-900 dark:text-zinc-50">Aktivitätslog</h1>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`w-10 h-10 flex items-center justify-center rounded-full border transition-colors ${showFilters ? 'bg-stone-900 dark:bg-zinc-50 text-white dark:text-zinc-900 border-stone-900 dark:border-zinc-50' : 'bg-white dark:bg-zinc-900 border-stone-200 dark:border-zinc-800 text-stone-600 dark:text-zinc-400'}`}
                        >
                            <Filter className="w-4 h-4" />
                        </button>
                        <button
                            onClick={fetchLogs}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 text-stone-600 dark:text-zinc-400"
                        >
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Filters */}
                {showFilters && (
                    <div className="px-4 pb-4 max-w-3xl mx-auto">
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-stone-200 dark:border-zinc-800 grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 dark:text-zinc-500 mb-1">Aktion</label>
                                <select
                                    value={filterAction}
                                    onChange={(e) => { setFilterAction(e.target.value); setPage(0); }}
                                    className="w-full bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm outline-none dark:text-zinc-50"
                                >
                                    <option value="">Alle</option>
                                    <option value="create">Erstellt</option>
                                    <option value="update">Aktualisiert</option>
                                    <option value="delete">Gelöscht</option>
                                    <option value="sell">Verkauft</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 dark:text-zinc-500 mb-1">Typ</label>
                                <select
                                    value={filterEntityType}
                                    onChange={(e) => { setFilterEntityType(e.target.value); setPage(0); }}
                                    className="w-full bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm outline-none dark:text-zinc-50"
                                >
                                    <option value="">Alle</option>
                                    <option value="items">Artikel</option>
                                    <option value="expenses">Ausgaben</option>
                                    <option value="item_certificates">Zertifikate</option>
                                    <option value="certificate_sales">Zert.-Verkäufe</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            <main className="max-w-3xl mx-auto p-4">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <RefreshCw className="w-6 h-6 animate-spin text-stone-400" />
                    </div>
                ) : logs.length === 0 ? (
                    <Card className="p-8 text-center">
                        <Clock className="w-8 h-8 text-stone-300 dark:text-zinc-600 mx-auto mb-3" />
                        <p className="text-sm text-stone-500 dark:text-zinc-400">Noch keine Aktivitäten aufgezeichnet.</p>
                    </Card>
                ) : (
                    <>
                        {/* Timeline */}
                        <div className="space-y-3">
                            {logs.map((log) => (
                                <Card key={log.id} className="p-4">
                                    <div className="flex items-start gap-3">
                                        {/* Icon */}
                                        <div className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-zinc-800 flex items-center justify-center text-stone-500 dark:text-zinc-400 shrink-0 mt-0.5">
                                            {ENTITY_ICONS[log.entity_type] || <Clock className="w-4 h-4" />}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${ACTION_COLORS[log.action] || 'bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                                                    {ACTION_LABELS[log.action] || log.action}
                                                </span>
                                                <span className="text-xs text-stone-500 dark:text-zinc-400">
                                                    {ENTITY_LABELS[log.entity_type] || log.entity_type}
                                                </span>
                                            </div>

                                            {renderChanges(log.changes, log.action)}

                                            <div className="flex items-center gap-3 mt-2 text-[11px] text-stone-400 dark:text-zinc-500">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {formatRelativeTime(log.created_at)}
                                                </span>
                                                <span>{formatTime(log.created_at)}</span>
                                                {log.entity_id && (
                                                    <span className="font-mono text-[10px] truncate max-w-[100px]">
                                                        {log.entity_id.slice(0, 8)}…
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-4 mt-6">
                                <button
                                    onClick={() => setPage(p => Math.max(0, p - 1))}
                                    disabled={page === 0}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 disabled:opacity-30 transition-opacity"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-sm text-stone-500 dark:text-zinc-400">
                                    Seite {page + 1} von {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                    disabled={page >= totalPages - 1}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 disabled:opacity-30 transition-opacity"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {/* Count */}
                        <p className="text-center text-xs text-stone-400 dark:text-zinc-500 mt-3">
                            {totalCount} Einträge insgesamt
                        </p>
                    </>
                )}
            </main>
        </FadeIn>
    );
};
