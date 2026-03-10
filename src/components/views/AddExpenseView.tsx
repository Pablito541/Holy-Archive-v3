import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Save, Receipt, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { supabase } from '../../lib/supabase';
import { useToast } from '../ui/Toast';
import { ExpenseCategory, Expense } from '../../types';
import { useImageUpload } from '../../hooks/useImageUpload';
import { validatePrice, validateTextLength, validateDateNotFuture, ValidationError } from '../../lib/validation';

interface AddExpenseViewProps {
    currentOrgId: string | null;
    onSave: () => void;
    onCancel: () => void;
    initialData?: Expense;
}

export const AddExpenseView = ({ currentOrgId, onSave, onCancel, initialData }: AddExpenseViewProps) => {
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [categories, setCategories] = useState<ExpenseCategory[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);

    const [amountStr, setAmountStr] = useState(initialData?.amount_eur ? initialData.amount_eur.toString().replace('.', ',') : '');
    const [selectedCategoryId, setSelectedCategoryId] = useState(initialData?.category_id || '');
    const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState(initialData?.description || '');
    const [isRecurring, setIsRecurring] = useState(initialData?.is_recurring || false);
    const [recurringInterval, setRecurringInterval] = useState(initialData?.recurring_interval || 'monthly');

    const {
        imageUrls,
        imagePreviews,
        uploading: uploadingImages,
        handleFileChange,
        handleRemoveExistingImage,
        handleRemovePendingImage,
        uploadAllImages,
    } = useImageUpload({
        initialImageUrls: initialData?.receipt_image_url ? [initialData.receipt_image_url] : [],
        isBulkMode: false,
        orgId: currentOrgId
    });

    // Fetch categories on mount
    useEffect(() => {
        const fetchCategories = async () => {
            if (!supabase || !currentOrgId) return;
            try {
                const { data, error } = await supabase
                    .from('expense_categories')
                    .select('*')
                    .eq('organization_id', currentOrgId)
                    .order('name');
                if (error) throw error;
                if (data) {
                    setCategories(data);
                    if (data.length > 0) {
                        setSelectedCategoryId(data[0].id);
                    }
                }
            } catch (err: unknown) {
                console.error('Error fetching categories:', err);
            } finally {
                setLoadingCategories(false);
            }
        };
        fetchCategories();
    }, [currentOrgId]);

    const handleSave = async () => {
        if (!currentOrgId || !supabase) return;

        const amount = parseFloat(amountStr.replace(',', '.'));
        try {
            validatePrice(amount, 'Betrag');
            validateTextLength(description, 2000, 'Beschreibung');
            validateDateNotFuture(date, 'Datum');

            if (isNaN(amount) || amount <= 0) {
                throw new ValidationError('Bitte einen gültigen positiven Betrag eingeben.');
            }
        } catch (error) {
            if (error instanceof ValidationError || error instanceof Error) {
                showToast(error.message, 'error');
                return;
            }
        }

        if (!selectedCategoryId) {
            showToast('Bitte eine Kategorie auswählen.', 'error');
            return;
        }

        if (isLoading || uploadingImages) return;
        setIsLoading(true);

        try {
            const finalImageUrls = await uploadAllImages();
            const receiptImageUrl = finalImageUrls.length > 0 ? finalImageUrls[0] : null;

            const expensePayload = {
                organization_id: currentOrgId,
                category_id: selectedCategoryId,
                amount_eur: amount,
                date: date,
                description: description || null,
                is_recurring: isRecurring,
                recurring_interval: isRecurring ? recurringInterval : null,
                receipt_image_url: receiptImageUrl
            };

            if (initialData) {
                const { error } = await supabase.from('expenses').update(expensePayload).eq('id', initialData.id);
                if (error) throw error;
                showToast('Ausgabe erfolgreich aktualisiert', 'success');
            } else {
                const { error } = await supabase.from('expenses').insert(expensePayload);
                if (error) throw error;
                showToast('Ausgabe erfolgreich erfasst', 'success');
            }

            onSave();
        } catch (err: any) {
            console.error('Error saving expense:', err);
            showToast('Fehler beim Speichern der Ausgabe', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#fafaf9] dark:bg-black font-sans pb-32">
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-stone-200 dark:border-zinc-800 sticky top-0 z-50">
                <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
                    <button onClick={onCancel} className="p-2 -ml-2 text-stone-400 hover:text-stone-900 dark:text-zinc-500 dark:hover:text-zinc-50 transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="font-serif font-bold text-lg">{initialData ? 'Ausgabe bearbeiten' : 'Ausgabe erfassen'}</h1>
                    <div className="w-10"></div>
                </div>
            </div>

            <main className="max-w-xl mx-auto px-4 py-8 space-y-6">
                {/* RECEIPT IMAGE SECTION */}
                <Card className="p-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="block text-sm font-bold text-stone-700 dark:text-zinc-300 ml-1">Beleg (Optional)</label>
                            {uploadingImages && <span className="text-xs text-stone-500">Uploading...</span>}
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            {imageUrls.map((url, idx) => (
                                <div key={`existing-${idx}`} className="relative aspect-square bg-stone-100 dark:bg-zinc-800 rounded-2xl overflow-hidden group">
                                    {url.toLowerCase().endsWith('.pdf') ? (
                                        <div className="flex flex-col items-center justify-center w-full h-full text-stone-400 dark:text-zinc-500 bg-stone-200 dark:bg-zinc-800/80 cursor-pointer" onClick={() => window.open(url, '_blank')}>
                                            <span className="font-bold text-sm">PDF ansehen</span>
                                        </div>
                                    ) : (
                                        <img src={url} className="w-full h-full object-cover" alt="Beleg" />
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveExistingImage(idx)}
                                        className="absolute top-2 right-2 w-7 h-7 bg-stone-900 dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}

                            {imagePreviews.map((preview, idx) => (
                                <div key={`preview-${idx}`} className="relative aspect-square bg-stone-100 dark:bg-zinc-800 rounded-2xl overflow-hidden group border-2 border-dashed border-stone-400 dark:border-zinc-600 flex items-center justify-center">
                                    {preview === 'pdf-document' ? (
                                        <div className="flex flex-col items-center justify-center text-stone-400 dark:text-zinc-500">
                                            <span className="font-bold text-sm">PDF Beleg</span>
                                        </div>
                                    ) : (
                                        <img src={preview} className="w-full h-full object-cover" alt="Preview Beleg" />
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => handleRemovePendingImage(idx)}
                                        className="absolute top-2 right-2 w-7 h-7 bg-stone-900 dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}

                            {/* Only allow 1 image max */}
                            {(imageUrls.length + imagePreviews.length) === 0 && (
                                <label className="aspect-square bg-stone-50 dark:bg-zinc-800 rounded-2xl border-2 border-dashed border-stone-300 dark:border-zinc-700 hover:border-stone-400 dark:hover:border-zinc-600 cursor-pointer flex flex-col items-center justify-center gap-2 transition-colors">
                                    <ImageIcon className="w-6 h-6 text-stone-400 dark:text-zinc-500" />
                                    <span className="text-[10px] text-stone-500 dark:text-zinc-400 font-medium">Foto hochladen</span>
                                    <input
                                        type="file"
                                        accept="image/*,application/pdf"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                </label>
                            )}
                        </div>
                    </div>
                </Card>

                <Card className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-stone-700 dark:text-zinc-300 mb-1.5 ml-1">Betrag (€)</label>
                            <Input
                                value={amountStr}
                                onChange={(e) => setAmountStr(e.target.value)}
                                placeholder="0,00"
                                type="number"
                                step="0.01"
                                className="w-full text-lg h-12"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-stone-700 dark:text-zinc-300 mb-1.5 ml-1">Kategorie</label>
                            {loadingCategories ? (
                                <div className="h-12 flex items-center justify-center border border-stone-200 dark:border-zinc-800 rounded-2xl bg-stone-50/50 dark:bg-zinc-900/50">
                                    <Loader2 className="w-5 h-5 animate-spin text-stone-400" />
                                </div>
                            ) : categories.length === 0 ? (
                                <div className="p-4 bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 rounded-2xl text-sm">
                                    Keine Ausgaben-Kategorien gefunden. Lege sie zuerst in den Einstellungen an.
                                </div>
                            ) : (
                                <Select
                                    label=""
                                    value={selectedCategoryId}
                                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                                    options={categories.map(c => ({ value: c.id, label: c.name }))}
                                    className="w-full h-12"
                                />
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-stone-700 dark:text-zinc-300 mb-1.5 ml-1">Datum</label>
                            <Input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full h-12"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-stone-700 dark:text-zinc-300 mb-1.5 ml-1">Beschreibung / Notiz (Optional)</label>
                            <Input
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="z.B. Monatliche Abo-Gebühr"
                                className="w-full h-12"
                            />
                        </div>

                        <div className="pt-4 border-t border-stone-100 dark:border-zinc-800">
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={isRecurring}
                                        onChange={(e) => setIsRecurring(e.target.checked)}
                                    />
                                    <div className={`block w-12 h-7 rounded-full transition-colors duration-300 ${isRecurring ? 'bg-emerald-500' : 'bg-stone-200 dark:bg-zinc-800'}`}></div>
                                    <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform duration-300 ${isRecurring ? 'transform translate-x-5' : ''}`}></div>
                                </div>
                                <span className="font-medium text-stone-900 dark:text-zinc-100">Wiederkehrende Ausgabe</span>
                            </label>

                            {isRecurring && (
                                <div className="mt-4 pl-14">
                                    <label className="block text-sm font-bold text-stone-700 dark:text-zinc-300 mb-1.5 ml-1">Intervall</label>
                                    <Select
                                        label=""
                                        value={recurringInterval}
                                        onChange={(e) => setRecurringInterval(e.target.value)}
                                        options={[
                                            { value: 'monthly', label: 'Monatlich' },
                                            { value: 'quarterly', label: 'Quartalsweise (Alle 3 Monate)' },
                                            { value: 'semi_annually', label: 'Halbjährlich (Alle 6 Monate)' },
                                            { value: 'yearly', label: 'Jährlich' }
                                        ]}
                                        className="w-full h-12"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </Card>

                <Button
                    onClick={handleSave}
                    loading={isLoading}
                    disabled={categories.length === 0 || !selectedCategoryId}
                    className="w-full"
                    icon={<Save className="w-5 h-5" />}
                >
                    Ausgabe speichern
                </Button>
            </main>
        </div>
    );
};
