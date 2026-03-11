import React, { useState, useEffect } from 'react';
import { Users, Mail, UserMinus, Plus, ShieldAlert, Loader2, Check } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../ui/Toast';
import { useConfirmDialog } from '../../ui/ConfirmDialog';
import { Card } from '../../ui/Card';
import { Input } from '../../ui/Input';
import { OrgRole, canManageMembers } from '../../../lib/roles';

interface TeamMember {
    member_id: string;
    user_id: string;
    role: OrgRole;
    email: string;
    created_at: string;
}

export const TeamSettings = ({ currentOrgId, userRole }: { currentOrgId: string, userRole?: OrgRole | null }) => {
    const { showToast } = useToast();
    const { confirm } = useConfirmDialog();
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isInviting, setIsInviting] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<OrgRole>('member');

    // Check if current user is allowed to manage team
    const hasAccess = canManageMembers(userRole);

    const loadTeam = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase!.rpc('get_team_members', { p_org_id: currentOrgId });
            if (error) throw error;
            setMembers(data || []);
        } catch (error) {
            console.error('Error loading team:', error);
            showToast('Fehler beim Laden des Teams', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (currentOrgId) {
            loadTeam();
        }
    }, [currentOrgId]);

    const handleInvite = async () => {
        if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
            showToast('Bitte eine gültige Email eingeben', 'error');
            return;
        }
        try {
            const { data, error } = await supabase!.functions.invoke('invite_user', {
                body: {
                    email: inviteEmail.trim(),
                    role: inviteRole,
                    org_id: currentOrgId
                }
            });
            if (error) throw error;

            showToast('Einladung erfolgreich versendet!', 'success');
            setIsInviting(false);
            setInviteEmail('');
            setInviteRole('member');
            loadTeam();
        } catch (error: any) {
            console.error('Error inviting:', error);
            showToast('Fehler beim Einladen: ' + error.message, 'error');
        }
    };

    const handleRemoveMember = async (memberId: string, email: string) => {
        const confirmed = await confirm({
            title: 'Mitglied entfernen?',
            description: `Möchtest du ${email || 'dieses Mitglied'} wirklich aus der Organisation entfernen?`,
            confirmLabel: 'Entfernen',
            variant: 'destructive'
        });
        if (!confirmed) return;

        try {
            const { error } = await supabase!.rpc('remove_team_member', {
                p_org_id: currentOrgId,
                p_member_id: memberId
            });
            if (error) throw error;
            showToast('Mitglied entfernt', 'success');
            loadTeam();
        } catch (error: any) {
            console.error('Error removing:', error);
            showToast('Fehler beim Entfernen: ' + error.message, 'error');
        }
    };

    const handleUpdateRole = async (memberId: string, newRole: string) => {
        try {
            const { error } = await supabase!.rpc('update_team_member_role', {
                p_org_id: currentOrgId,
                p_member_id: memberId,
                p_new_role: newRole
            });
            if (error) throw error;
            showToast('Rolle aktualisiert', 'success');
            loadTeam();
        } catch (error: any) {
            console.error('Error updating role:', error);
            showToast('Fehler beim Aktualisieren der Rolle: ' + error.message, 'error');
        }
    };

    return (
        <section>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-bold text-stone-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Users className="w-4 h-4" /> Team
                </h2>
                {hasAccess && (
                    <button
                        onClick={() => setIsInviting(true)}
                        className="bg-stone-100 dark:bg-zinc-800 text-stone-900 dark:text-zinc-50 p-1.5 rounded-lg active:scale-95 transition-transform flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="text-xs font-bold pr-1">Einladen</span>
                    </button>
                )}
            </div>

            <Card className="overflow-hidden divide-y divide-stone-100 dark:divide-zinc-800">
                {isInviting && (
                    <div className="p-4 bg-stone-50 dark:bg-zinc-900/50 flex flex-col gap-3">
                        <Input
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="email@example.com"
                            className="bg-white"
                            autoFocus
                        />
                        <div className="flex gap-2 relative">
                            <select
                                value={inviteRole}
                                onChange={(e) => setInviteRole(e.target.value as OrgRole)}
                                className="flex-1 appearance-none bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm font-medium outline-none"
                            >
                                <option value="admin">Admin</option>
                                <option value="member">Mitglied</option>
                                <option value="viewer">Betrachter</option>
                            </select>
                        </div>
                        <div className="flex gap-2 mt-2">
                            <button onClick={handleInvite} className="flex-1 text-sm font-bold bg-stone-900 dark:bg-zinc-50 text-white dark:text-zinc-900 px-4 py-2 rounded-xl">
                                Einladen
                            </button>
                            <button onClick={() => setIsInviting(false)} className="flex-1 text-sm font-bold bg-stone-200 dark:bg-zinc-800 px-4 py-2 rounded-xl">
                                Abbrechen
                            </button>
                        </div>
                    </div>
                )}

                {isLoading ? (
                    <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-stone-400" /></div>
                ) : (
                    members.map(member => (
                        <div key={member.member_id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <div className="font-bold text-stone-900 dark:text-zinc-50 flex items-center gap-2">
                                    {member.email || 'Unbekannter Nutzer'}
                                    {member.role === 'owner' && <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />}
                                </div>
                                <div className="text-sm text-stone-500 dark:text-zinc-400 mt-0.5">
                                    Beigetreten: {new Date(member.created_at).toLocaleDateString()}
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <select
                                    disabled={!hasAccess || member.role === 'owner'}
                                    value={member.role}
                                    onChange={(e) => handleUpdateRole(member.member_id, e.target.value)}
                                    className="appearance-none bg-stone-100 dark:bg-zinc-800 border border-transparent disabled:opacity-50 text-stone-700 dark:text-zinc-300 text-xs font-semibold py-1.5 px-3 rounded-lg outline-none cursor-pointer"
                                >
                                    <option value="owner" disabled>Owner</option>
                                    <option value="admin">Admin</option>
                                    <option value="member">Mitglied</option>
                                    <option value="viewer">Betrachter</option>
                                </select>

                                {hasAccess && member.role !== 'owner' && (
                                    <button
                                        onClick={() => handleRemoveMember(member.member_id, member.email)}
                                        className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        title="Mitglied entfernen"
                                    >
                                        <UserMinus className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </Card>
        </section>
    );
};
