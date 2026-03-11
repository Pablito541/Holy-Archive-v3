-- Add INSERT policies needed for the onboarding flow
-- Problem: organizations and organization_members only had SELECT policies,
-- so authenticated users couldn't create orgs during onboarding.

-- 1. Allow authenticated users to create organizations
CREATE POLICY "Authenticated users can create organizations"
ON organizations FOR INSERT
TO authenticated
WITH CHECK (true);

-- 2. Allow authenticated users to add themselves to organizations
CREATE POLICY "Users can add themselves to organizations"
ON organization_members FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
