# Holy Archive v3 — Projektkontext

## Was ist Holy Archive?
Inventar- und Profit-Management-App für Vintage-Luxusgüter (Taschen, Wallets, Accessoires). Wird zu einem kommerziellen SaaS-Produkt (monatliches Abo) ausgebaut.

## Tech Stack
- **Frontend**: Next.js 16 + React 19 + TypeScript + Tailwind CSS 3.4
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Deployment**: Vercel
- **PWA**: @ducanh2912/next-pwa
- **Charts**: Recharts 3.7

## Architektur-Status (März 2026)

### Was gerade parallel von Agenten refactored wird:
Folgende Branches werden parallel bearbeitet — NICHT in diese Bereiche eingreifen:
- `fix/security-hardening` — RLS, Auth, Validierung, Rate Limiting
- `fix/database-scalability` — Indexes, RPC, Constraints, N+1
- `feature/multi-tenancy` — Onboarding, RBAC, Team-Verwaltung
- `refactor/code-quality` — God Component aufbrechen, Error Boundaries, Tests
- `perf/optimization` — Code Splitting, Caching, URL-Routing
- `fix/ux-robustness` — Toast, Dialoge, Upload-Feedback, Unsaved Changes
- `feature/compliance-saas` — Audit-Log, Billing-Modell, Monitoring, Datenschutz

### Bekannte Architektur-Probleme:
1. **God Component**: `DashboardClient.tsx` (1000+ Zeilen) verwaltet allen State. Wird von Agent 4 aufgebrochen.
2. **State-basiertes Routing**: Navigation über useState statt URL-Routing. Wird von Agent 5 zu App Router migriert.
3. **Kein API-Layer**: Frontend ruft Supabase direkt auf. Noch kein Agent dafür — wird separat umgesetzt.
4. **81x `any` Types**: TypeScript-Typisierung unvollständig. Wird von Agent 4 behoben.

## Datenbank-Schema (Kern-Tabellen)
- `organizations` — Multi-Tenancy Root (id, slug, name, logo_url)
- `organization_members` — User-Org Junction (user_id, org_id, role: owner|member)
- `items` — Inventar (brand, model, category, condition, status, prices, images)
- `item_certificates` — Zertifikate pro Item (provider, cost, sale_price)
- `certificate_providers` — Anbieter (Entrupy, Real Authentication etc.)
- `expenses` — Ausgaben (category_id, amount, recurring)
- `expense_categories` — Ausgaben-Kategorien
- `leads` — Showroom-Leads (WIRD ENTFERNT)
- `profiles` — User-Profile (username, avatar)

## Supabase-Projekt
- **Projekt-ID**: Siehe .env.local
- **Auth**: Email/Password (aktuell nur Login, kein Signup)
- **Storage**: `images` Bucket (public read, auth upload)
- **RPC**: `get_detailed_dashboard_stats()` — Dashboard-Aggregation

## Konventionen
- Sprache im Code: Englisch
- Commit-Messages: Englisch, präfix mit Bereich (z.B. `feat(auth): add signup flow`)
- Branch-Naming: `feat/`, `fix/`, `refactor/`, `perf/`, `chore/`
- Komponenten: Functional Components mit Hooks, keine Class Components
- Styling: Tailwind CSS Utility Classes, kein CSS-in-JS
- State: React Context + Hooks (nach Refactoring durch Agent 4)
- Formulare: Kontrollierte Inputs mit useState
- Fehlerbehandlung: try/catch mit Toast-Notifications (nach Agent 6)

## Was NICHT mehr in der App sein soll
- **Showroom/Shop**: Die `/shop` Route, `authorize_showroom.sql`, `create_leads.sql`, `public_items_by_showroom` View und die `leads`-Tabelle sollen komplett entfernt werden. Das Feature wurde verworfen.

## Umgebungsvariablen
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```
Weitere werden bei Bedarf ergänzt (Stripe, Sentry, SMTP etc.)
