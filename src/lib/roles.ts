export type OrgRole = 'owner' | 'admin' | 'member' | 'viewer';

export function canDelete(role: OrgRole | null | undefined): boolean {
    return role === 'owner' || role === 'admin';
}

export function canManageSettings(role: OrgRole | null | undefined): boolean {
    return role === 'owner' || role === 'admin';
}

export function canManageMembers(role: OrgRole | null | undefined): boolean {
    return role === 'owner' || role === 'admin';
}

export function canCreateItems(role: OrgRole | null | undefined): boolean {
    return role === 'owner' || role === 'admin' || role === 'member';
}

export function canSellItems(role: OrgRole | null | undefined): boolean {
    return role === 'owner' || role === 'admin' || role === 'member';
}

export function canEditItems(role: OrgRole | null | undefined): boolean {
    return role === 'owner' || role === 'admin' || role === 'member';
}
