# Architektur-Übersicht

## Tech Stack
- Frontend: Next.js 16 + React 19 + TypeScript
- Backend: Supabase (PostgreSQL + Auth + Storage)
- Styling: Tailwind CSS 3.4
- Deployment: Vercel (PWA)
- Charts: Recharts

## Ordnerstruktur
- src/app/ — Next.js App Router Pages
- src/components/views/ — View-Komponenten (16 Views)
- src/components/ui/ — Shared UI Components
- src/components/providers/ — Context Providers
- src/hooks/ — Custom React Hooks
- src/lib/ — Supabase Client & Utilities
- src/types.ts — TypeScript Typen
- src/constants.ts — App-Konstanten
- supabase/migrations/ — Datenbank-Migrationen

## Bekannte Architektur-Probleme
Siehe SaaS-Readiness Analyse (PDF) für vollständige Liste.
Kurzfassung: 28 identifizierte Probleme in 7 Kategorien.
