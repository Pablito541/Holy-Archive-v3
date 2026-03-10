import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Building2, Receipt, Plus, Trash2, Edit2, Loader2, Camera, X } from 'lucide-react';
import { FadeIn } from '../ui/FadeIn';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { useToast } from '../ui/Toast';
import { supabase } from '../../lib/supabase';
import { CertificateProvider, ExpenseCategory } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { useImageUpload } from '../../hooks/useImageUpload';

const CertificateProviderForm = ({
    initialData,
    currentOrgId,
    onSave,
    onCancel
}: {
    initialData?: CertificateProvider;
    currentOrgId: string;
    onSave: (cert: CertificateProvider) => void;
    onCancel: () => void;
}) => {
    const { showToast } = useToast();
    const [name, setName] = useState(initialData?.name || '');
    const [unitCost, setUnitCost] = useState(initialData?.unit_cost_eur?.toString() || '');

    const {
        imageUrls,
        imagePreviews,
        uploading: uploadingImages,
        handleFileChange,
        handleRemoveExistingImage,
        handleRemovePendingImage,
        uploadAllImages,
    } = useImageUpload({
        initialImageUrls: initialData?.image_url ? [initialData.image_url] : [],
        isBulkMode: false,
        orgId: currentOrgId
    });

    const handleSave = async () => {
        if (!name.trim()) {
            showToast('Bitte gib einen Namen ein', 'error');
            return;
        }

        const cost = parseFloat(unitCost.replace(',', '.')) || 0;

        try {
            const uploadedUrls = await uploadAllImages();
            const finalImageUrl = uploadedUrls.length > 0 ? uploadedUrls[0] : (imageUrls.length > 0 ? imageUrls[0] : null);

            let savedData;
            if (initialData) {
                const { data, error } = await supabase!
                    .from('certificate_providers')
                    .update({ name, unit_cost_eur: cost, image_url: finalImageUrl })
                    .eq('id', initialData.id)
                    .select()
                    .single();
                if (error) throw error;
                savedData = data;
                showToast('Zertifikat aktualisiert', 'success');
            } else {
                const { data, error } = await supabase!
                    .from('certificate_providers')
                    .insert({ organization_id: currentOrgId, name, unit_cost_eur: cost, image_url: finalImageUrl })
                    .select()
                    .single();
                if (error) throw error;
                savedData = data;
                showToast('Zertifikat hinzugefügt', 'success');
            }
            onSave(savedData as CertificateProvider);
        } catch (error) {
            console.error('Error saving certificate:', error);
            showToast('Fehler beim Speichern', 'error');
        }
    };

    return (
        <div className={`p-4 ${!initialData ? 'bg-stone-50 dark:bg-zinc-900/50' : ''} flex flex-col gap-4 border-b border-stone-100 dark:border-zinc-800 last:border-0`}>
            <div className="flex flex-col sm:flex-row gap-2">
                <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Name (z.B. Entrupy)"
                    className={`flex-1 ${!initialData ? 'bg-white' : ''}`}
                    autoFocus
                />
                <div className="relative w-full sm:w-32">
                    <Input
                        type="number"
                        value={unitCost}
                        onChange={(e) => setUnitCost(e.target.value)}
                        placeholder="Kosten"
                        className={`pl-8 ${!initialData ? 'bg-white' : ''}`}
                        step="0.01"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">€</span>
                </div>
            </div>

            <div className="flex items-center justify-between gap-4">
                <div className="flex gap-2 relative">
                    {imageUrls.map((url, i) => (
                        <div key={`existing-${i}`} className="relative w-12 h-12 rounded-xl overflow-hidden bg-stone-100 dark:bg-zinc-800">
                            <img src={url} alt="Zertifikat" className="w-full h-full object-cover" />
                            <button onClick={() => handleRemoveExistingImage(i)} className="absolute top-1 right-1 w-4 h-4 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white"><X className="w-2.5 h-2.5" /></button>
                        </div>
                    ))}
                    {imagePreviews.map((preview, i) => (
                        <div key={`preview-${i}`} className="relative w-12 h-12 rounded-xl overflow-hidden bg-stone-100 dark:bg-zinc-800">
                            <img src={preview} alt="Vorschau" className="w-full h-full object-cover opacity-70" />
                            <button onClick={() => handleRemovePendingImage(i)} className="absolute top-1 right-1 w-4 h-4 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white"><X className="w-2.5 h-2.5" /></button>
                        </div>
                    ))}

                    {imageUrls.length + imagePreviews.length === 0 && (
                        <label className="w-12 h-12 flex flex-col items-center justify-center border-2 border-dashed border-stone-200 dark:border-zinc-800 rounded-xl cursor-pointer hover:bg-stone-50 dark:hover:bg-zinc-900 transition-colors">
                            <Camera className="w-4 h-4 text-stone-400" />
                            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                        </label>
                    )}
                </div>

                <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                    <button onClick={handleSave} disabled={uploadingImages} className="flex-1 sm:flex-none text-sm font-bold bg-stone-900 dark:bg-zinc-50 text-white dark:text-zinc-900 px-4 py-2 rounded-xl disabled:opacity-50">
                        {uploadingImages ? 'Lädt...' : 'Speichern'}
                    </button>
                    <button onClick={onCancel} disabled={uploadingImages} className="flex-1 sm:flex-none text-sm font-bold bg-stone-200 dark:bg-zinc-800 px-4 py-2 rounded-xl disabled:opacity-50">Abbrechen</button>
                </div>
            </div>
        </div>
    );
};

interface SettingsViewProps {
    onBack: () => void;
    onExport: () => void;
    currentOrgId: string | null;
}

export const SettingsView = ({ onBack, onExport, currentOrgId }: SettingsViewProps) => {
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(true);

    // Certificates State
    const [certificates, setCertificates] = useState<CertificateProvider[]>([]);
    const [isAddingCert, setIsAddingCert] = useState(false);
    const [editingCertId, setEditingCertId] = useState<string | null>(null);
    const [certForm, setCertForm] = useState({ name: '', unitCost: '' });

    // Expenses State
    const [expenses, setExpenses] = useState<ExpenseCategory[]>([]);
    const [isAddingExpense, setIsAddingExpense] = useState(false);
    const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
    const [expenseForm, setExpenseForm] = useState({ name: '' });

    useEffect(() => {
        if (!currentOrgId || !supabase) return;

        const fetchData = async () => {
            if (!supabase || !currentOrgId) return;
            setIsLoading(true);
            try {
                // Fetch Certificates
                const { data: certData, error: certError } = await supabase
                    .from('certificate_providers')
                    .select('*')
                    .eq('organization_id', currentOrgId)
                    .order('created_at', { ascending: true });

                if (certError) throw certError;
                if (certData) setCertificates(certData as CertificateProvider[]);

                // Fetch Expenses
                const { data: expData, error: expError } = await supabase
                    .from('expense_categories')
                    .select('*')
                    .eq('organization_id', currentOrgId)
                    .order('created_at', { ascending: true });

                if (expError) throw expError;
                if (expData) setExpenses(expData as ExpenseCategory[]);

            } catch (error) {
                console.error('Error fetching settings data:', error);
                showToast('Fehler beim Laden der Einstellungen', 'error');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [currentOrgId]);


    // --- Certificate Actions ---

    const handleDeleteCertificate = async (id: string, name: string) => {
        if (!confirm(`Möchtest du '${name}' wirklich löschen?`)) return;

        try {
            const { error } = await supabase!.from('certificate_providers').delete().eq('id', id);
            if (error) throw error;
            setCertificates(prev => prev.filter(c => c.id !== id));
            showToast('Zertifikat gelöscht', 'success');
        } catch (error) {
            console.error('Error deleting certificate:', error);
            showToast('Fehler beim Löschen', 'error');
        }
    };


    // --- Expense Category Actions ---

    const handleSaveExpense = async () => {
        if (!expenseForm.name.trim()) {
            showToast('Bitte gib einen Namen ein', 'error');
            return;
        }

        try {
            if (editingExpenseId) {
                // Update
                const { error } = await supabase!
                    .from('expense_categories')
                    .update({ name: expenseForm.name })
                    .eq('id', editingExpenseId);

                if (error) throw error;

                setExpenses(prev => prev.map(e =>
                    e.id === editingExpenseId ? { ...e, name: expenseForm.name } : e
                ));
                showToast('Kategorie aktualisiert', 'success');
            } else {
                // Insert
                const { data, error } = await supabase!
                    .from('expense_categories')
                    .insert({ organization_id: currentOrgId!, name: expenseForm.name })
                    .select()
                    .single();

                if (error) throw error;
                if (data) setExpenses(prev => [...prev, data as ExpenseCategory]);
                showToast('Kategorie hinzugefügt', 'success');
            }

            // Reset form
            setIsAddingExpense(false);
            setEditingExpenseId(null);
            setExpenseForm({ name: '' });

        } catch (error) {
            console.error('Error saving expense category:', error);
            showToast('Fehler beim Speichern', 'error');
        }
    };

    const handleDeleteExpense = async (id: string, name: string) => {
        if (!confirm(`Möchtest du '${name}' wirklich löschen? Es darf keine Ausgaben zu dieser Kategorie geben.`)) return;

        try {
            const { error } = await supabase!.from('expense_categories').delete().eq('id', id);
            if (error) throw error;
            setExpenses(prev => prev.filter(e => e.id !== id));
            showToast('Kategorie gelöscht', 'success');
        } catch (error) {
            console.error('Error deleting expense category:', error);
            showToast('Fehler beim Löschen. Eventuell existieren noch Ausgaben.', 'error');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
            </div>
        );
    }

    return (
        <FadeIn className="px-6 pt-safe pb-24 max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8 sticky top-0 bg-[#fafaf9]/80 dark:bg-black/80 backdrop-blur-xl z-10 py-4 -mx-6 px-6">
                <button
                    onClick={onBack}
                    className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 text-stone-900 dark:text-zinc-50 shadow-sm hover:scale-105 active:scale-95 transition-all"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-2xl font-serif font-bold text-stone-900 dark:text-zinc-50">Einstellungen</h1>
            </div>

            <div className="space-y-6">

                {/* Export Section */}
                <section>
                    <h2 className="text-xs font-bold text-stone-400 dark:text-zinc-500 tracking-wider uppercase ml-1 mb-3">Export & Backups</h2>
                    <Card className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-stone-900 dark:text-zinc-50 flex items-center gap-2">
                                    <Download className="w-4 h-4 text-stone-500" /> Daten-Export
                                </h3>
                                <p className="text-sm text-stone-500 dark:text-zinc-400 mt-1">
                                    Exportiere alle Artikeldaten als CSV/Excel (z.B. für den Steuerberater).
                                </p>
                            </div>
                            <button
                                onClick={onExport}
                                className="bg-stone-100 dark:bg-zinc-800 text-stone-900 dark:text-zinc-50 hover:bg-stone-200 dark:hover:bg-zinc-700 px-4 py-2 rounded-xl text-sm font-bold transition-colors shrink-0 ml-4"
                            >
                                Export
                            </button>
                        </div>
                    </Card>
                </section>

                {/* Certificates Section */}
                <section>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-sm font-bold text-stone-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                            <Building2 className="w-4 h-4" /> Zertifikate
                        </h2>
                        <button
                            onClick={() => { setIsAddingCert(true); setEditingCertId(null); setCertForm({ name: '', unitCost: '' }); }}
                            className="bg-stone-100 dark:bg-zinc-800 text-stone-900 dark:text-zinc-50 p-1.5 rounded-lg active:scale-95 transition-transform"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    <Card className="overflow-hidden divide-y divide-stone-100 dark:divide-zinc-800">
                        {certificates.length === 0 && !isAddingCert ? (
                            <div className="p-6 text-center text-sm text-stone-500 dark:text-zinc-400">
                                Keine Zertifikat-Anbieter konfiguriert.
                            </div>
                        ) : null}

                        {certificates.map(cert => (
                            <div key={cert.id} className="border-b border-stone-100 dark:border-zinc-800 last:border-0">
                                {editingCertId === cert.id ? (
                                    <CertificateProviderForm
                                        initialData={cert}
                                        currentOrgId={currentOrgId!}
                                        onSave={(updatedCert) => {
                                            setCertificates(prev => prev.map(c => c.id === updatedCert.id ? updatedCert : c));
                                            setEditingCertId(null);
                                        }}
                                        onCancel={() => setEditingCertId(null)}
                                    />
                                ) : (
                                    <div className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {cert.image_url ? (
                                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-stone-100 dark:bg-zinc-800">
                                                    <img src={cert.image_url} alt={cert.name} className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="w-10 h-10 rounded-lg bg-stone-100 dark:bg-zinc-800 flex items-center justify-center">
                                                    <Building2 className="w-5 h-5 text-stone-400" />
                                                </div>
                                            )}
                                            <div>
                                                <span className="font-bold text-stone-900 dark:text-zinc-50 block">{cert.name}</span>
                                                <span className="text-sm text-stone-500 dark:text-zinc-400">
                                                    {formatCurrency(cert.unit_cost_eur)} / Stück
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 ml-2">
                                            <button
                                                onClick={() => { setEditingCertId(cert.id); }}
                                                className="p-2 text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCertificate(cert.id, cert.name)}
                                                className="p-2 text-red-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {isAddingCert && (
                            <CertificateProviderForm
                                currentOrgId={currentOrgId!}
                                onSave={(newCert) => {
                                    setCertificates(prev => [...prev, newCert]);
                                    setIsAddingCert(false);
                                }}
                                onCancel={() => setIsAddingCert(false)}
                            />
                        )}
                    </Card>
                    <p className="text-xs text-stone-400 mt-2 px-1">
                        Dies dient als Vorbelegung für künftige Zertifikats-Buchungen.
                    </p>
                </section>

                {/* Expenses Section */}
                <section>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-sm font-bold text-stone-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                            <Receipt className="w-4 h-4" /> Ausgaben-Kategorien
                        </h2>
                        <button
                            onClick={() => { setIsAddingExpense(true); setEditingExpenseId(null); setExpenseForm({ name: '' }); }}
                            className="bg-stone-100 dark:bg-zinc-800 text-stone-900 dark:text-zinc-50 p-1.5 rounded-lg active:scale-95 transition-transform"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    <Card className="overflow-hidden divide-y divide-stone-100 dark:divide-zinc-800">
                        {expenses.length === 0 && !isAddingExpense ? (
                            <div className="p-6 text-center text-sm text-stone-500 dark:text-zinc-400">
                                Keine Ausgaben-Kategorien konfiguriert.
                            </div>
                        ) : null}

                        {expenses.map(expense => (
                            <div key={expense.id} className="p-4 flex items-center justify-between">
                                {editingExpenseId === expense.id ? (
                                    <div className="flex-1 flex flex-col sm:flex-row gap-2">
                                        <Input
                                            value={expenseForm.name}
                                            onChange={(e) => setExpenseForm({ name: e.target.value })}
                                            placeholder="z.B. Verpackungsmaterial"
                                            className="flex-1"
                                            autoFocus
                                        />
                                        <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                            <button onClick={handleSaveExpense} className="flex-1 sm:flex-none text-sm font-bold bg-stone-900 dark:bg-zinc-50 text-white dark:text-zinc-900 px-4 py-2 rounded-xl">Speichern</button>
                                            <button onClick={() => setEditingExpenseId(null)} className="flex-1 sm:flex-none text-sm font-bold bg-stone-100 dark:bg-zinc-800 px-4 py-2 rounded-xl">Abbrechen</button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <span className="font-bold text-stone-900 dark:text-zinc-50">{expense.name}</span>
                                        <div className="flex gap-1 ml-2">
                                            <button
                                                onClick={() => { setEditingExpenseId(expense.id); setExpenseForm({ name: expense.name }); }}
                                                className="p-2 text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteExpense(expense.id, expense.name)}
                                                className="p-2 text-red-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}

                        {isAddingExpense && (
                            <div className="p-4 bg-stone-50 dark:bg-zinc-900/50 flex flex-col sm:flex-row gap-2">
                                <Input
                                    value={expenseForm.name}
                                    onChange={(e) => setExpenseForm({ name: e.target.value })}
                                    placeholder="Name der Kategorie (z.B. Abo)"
                                    className="flex-1 bg-white"
                                    autoFocus
                                />
                                <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                    <button onClick={handleSaveExpense} className="flex-1 sm:flex-none text-sm font-bold bg-stone-900 dark:bg-zinc-50 text-white dark:text-zinc-900 px-4 py-2 rounded-xl">Speichern</button>
                                    <button onClick={() => setIsAddingExpense(false)} className="flex-1 sm:flex-none text-sm font-bold bg-stone-200 dark:bg-zinc-800 px-4 py-2 rounded-xl">Abbrechen</button>
                                </div>
                            </div>
                        )}
                    </Card>
                </section>

            </div>
        </FadeIn>
    );
};
