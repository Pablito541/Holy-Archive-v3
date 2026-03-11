'use client';

import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface AuthContextType {
    user: any;
    orgId: string | null;
    isAuthenticated: boolean;
    logout: () => Promise<void>;
    setUser: (user: any) => void;
    setOrgId: (orgId: string | null) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    initialUser: any;
    initialOrgId: string | null;
    children: React.ReactNode;
}

export const AuthProvider = ({ initialUser, initialOrgId, children }: AuthProviderProps) => {
    const [user, setUser] = useState<any>(initialUser);
    const [orgId, setOrgId] = useState<string | null>(initialOrgId);

    // Listen for auth state changes
    useEffect(() => {
        if (!supabase) return;

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const currentUser = session?.user ?? null;
            console.log('AuthProvider: Auth state change:', _event, currentUser?.email);
            setUser(currentUser);

            if (currentUser) {
                // Fetch org membership
                if (supabase) {
                    supabase
                        .from('organization_members')
                        .select('organization_id')
                        .eq('user_id', currentUser.id)
                        .maybeSingle()
                        .then(({ data: member, error }) => {
                            if (error) {
                                console.error("AuthProvider: Error fetching organization membership:", error);
                            }
                            if (member) {
                                setOrgId(member.organization_id);
                            } else {
                                console.log("AuthProvider: No organization membership found for user.");
                            }
                        });
                }
            } else {
                setOrgId(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const logout = async () => {
        if (supabase) await supabase.auth.signOut();
        setUser(null);
        setOrgId(null);
    };

    const value: AuthContextType = {
        user,
        orgId,
        isAuthenticated: !!user,
        logout,
        setUser,
        setOrgId,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
