'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { OrgRole } from '../lib/roles';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    orgId: string | null;
    userRole: OrgRole | null;
    isLoading: boolean;
    signIn: (user: User) => void;
    signOut: () => Promise<void>;
    setOrgId: (orgId: string | null) => void;
    setUserRole: (role: OrgRole | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
    initialUser: User | null;
    initialOrgId: string | null;
}

export function AuthProvider({ children, initialUser, initialOrgId }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(initialUser);
    const [orgId, setOrgId] = useState<string | null>(initialOrgId);
    const [userRole, setUserRole] = useState<OrgRole | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!supabase) return;

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);

            if (currentUser) {
                if (supabase) {
                    const fetchMembership = () => {
                        supabase!
                            .from('organization_members')
                            .select('organization_id, role')
                            .eq('user_id', currentUser.id)
                            .maybeSingle()
                            .then(({ data: member }: { data: any }) => {
                                if (member && member.organization_id) {
                                    setOrgId(member.organization_id);
                                    setUserRole(member.role as OrgRole);
                                } else {
                                    setOrgId(null);
                                    setUserRole(null);
                                }
                                setIsLoading(false);
                            });
                    };
                    supabase.rpc('check_and_accept_invitations').then(fetchMembership, () => fetchMembership());
                }
            } else {
                setOrgId(null);
                setUserRole(null);
                setIsLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const signIn = (u: User) => setUser(u);

    const signOut = async () => {
        if (supabase) await supabase.auth.signOut();
        setUser(null);
        setOrgId(null);
        setUserRole(null);
    };

    return (
        <AuthContext.Provider value={{ user, orgId, userRole, isLoading, signIn, signOut, setOrgId, setUserRole }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
