# Supabase Rate Limiting Empfehlungen

Um die Sicherheit und Skalierbarkeit für Holy-Archive-v3 im Produktionsbetrieb zu gewährleisten, sollten die Standard-Rate-Limits in Supabase entsprechend den Anforderungen der SaaS-Applikation konfiguriert werden.

## 1. Authentication Rate Limits
Das Supabase-Dashboard bietet unter `Authentication -> Rate Limits` Einstellungen zum Schutz vor Brute-Force- und Enumeration-Angriffen.

**Empfohlene Konfigurationen:**
- **Email/Password Sign-In Limit:** `30 pro Stunde pro IP`
  - Begründung: Schützt vor Credential Stuffing und Brute-Force-Angriffen auf Passwörter.
- **Sign-Up Limit:** `10 pro Stunde pro IP`
  - Begründung: Verhindert massenhafte Erstellung von Spam-Accounts.
- **Magic Link / OTP / Password Reset Limit:** `5 pro Stunde pro User`
  - Begründung: Schützt vor Missbrauch des E-Mail-Systems (E-Mail-Bombing).

## 2. API / Database Rate Limits (PostgREST)
Supabase nutzt im Standard kein striktes API-Rate-Limiting out-of-the-box in niedrigen Tiers, bietet jedoch Schutzfunktionen und Erweiterungsmöglichkeiten.

**Empfohlene Vorgehensweise:**
- **Supabase WAF (Web Application Firewall):** Falls auf einem höheren Tier verfügbar, aktivieren Sie die WAF, um allgemeine DDoS-Angriffe und automatisierte Scraping-Versuche abzuwehren.
- **PostgreSQL Rate Limiting via Extensions:** 
  Als SaaS-Anwendung empfehlen wir, kritische und teure RPCs (z.B. Dashboard-Aggregationen) durch ein API-Gateway oder über `pgcrypto` und Sessions in der DB rate-zu-limiten, falls diese extrem häufig abgerufen werden.

## 3. Storage Rate Limits
**Bilder & Zertifikate Uploads:**
- Während wir client-seitige Skalierungsbeschränkungen (10MB und Dateityp-Prüfungen) implementiert haben, sollte serverseitig sichergestellt werden, dass Benutzer das Storage Limit des Buckets nicht mit automatisierten Scripts auffüllen.
- Dies wird durch die neu eingeführte `Organization Member Insert Access` Policy bereits signifikant entschärft, da Uploads authentifiziert und dem jeweiligen Org-Ordner zugeordnet sein müssen.

## 4. Client-Site Fallbacks (Bereits implementiert)
Im React/Next.js Client wurde in `LoginView.tsx` ein Lockout von 60 Sekunden nach 5 fehlgeschlagenen Anmeldeversuchen implementiert. Dieser Soft-Block reduziert die Last auf die Supabase API-Endpoints signifikant und gibt den Nutzern direktes Feedback.
