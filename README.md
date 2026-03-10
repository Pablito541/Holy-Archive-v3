# Holy Archive v3 - Vintage Inventory & Profit Tracking

> Weiterentwicklung von [Holy Archive v2](https://github.com/paulheilig/Holy-Archive-v2) mit neuem Supabase-Backend und verbesserter Architektur.

Ein modernes Inventar-Management-System für Vintage-Artikel mit integriertem Profit-Tracking, gebaut mit Next.js und Supabase.

![Next.js](https://img.shields.io/badge/Next.js-16.0-black)
![React](https://img.shields.io/badge/React-19.2-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4)

## ✨ Features

- 📊 **Dashboard** - Übersicht über monatliche Gewinne, Lagerbestand und Performance-Metriken  
- 📦 **Inventar-Verwaltung** - Vollständige Verwaltung von Artikeln mit Such- und Filter-Funktionen
- 💰 **Verkaufs-Tracking** - Erfassung von Verkäufen mit automatischer Profit-Berechnung
- 🏷️ **Reservierungen** - Artikel für Kunden reservieren mit Ablaufdatum
- 📈 **Analytics** - Verkaufskanäle, Top-Brands und Margen-Analyse
- 📤 **Export** - Daten-Export für externe Analysen
- 🎨 **Modern UI** - Glassmorphism, Gradients, und smooth Animationen

## 🚀 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **UI**: React 19 + Tailwind CSS mit custom Design System
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL + Auth + Storage)
- **Charts**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Deployment**: Vercel (PWA)

## 📋 Voraussetzungen

- Node.js 18+ 
- npm oder yarn
- Supabase Account (kostenlos)

## 🛠️ Installation

1. **Repository klonen**
   ```bash
   git clone <your-repo-url>
   cd holy-archive-v3
   ```

2. **Dependencies installieren**
   ```bash
   npm install
   ```

3. **Environment Variables einrichten**
   
   Kopiere die `.env.example` und trage deine Supabase-Credentials ein:
   ```bash
   cp .env.example .env.local
   ```

   Siehe [ENV-README.md](./ENV-README.md) für detaillierte Anleitung.

4. **Development Server starten**
   ```bash
   npm run dev
   ```

   Öffne [http://localhost:3000](http://localhost:3000) im Browser.

## 🗄️ Datenbank Setup

Die App verwendet Supabase mit folgendem Schema:

```sql
create table items (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  model text,
  category text not null,
  condition text not null,
  status text not null default 'in_stock',
  purchase_price_eur numeric not null,
  purchase_date timestamp with time zone,
  purchase_source text,
  sale_price_eur numeric,
  sale_date timestamp with time zone,
  sale_channel text,
  platform_fees_eur numeric,
  shipping_cost_eur numeric,
  reserved_for text,
  reserved_until timestamp with time zone,
  image_urls text[],
  notes text,
  created_at timestamp with time zone default now()
);
```

## 🚢 Deployment auf Vercel

1. **GitHub Repository**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push
   ```

2. **Vercel Setup**
   - Gehe zu [vercel.com](https://vercel.com)
   - Klicke auf "Add New Project"
   - Importiere dein GitHub Repository
   - Konfiguriere Environment Variables (siehe ENV-README.md)
   - Klicke auf "Deploy"

3. **Environment Variables in Vercel**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Detaillierte Deployment-Anleitung: [DEPLOYMENT.md](./DEPLOYMENT.md)

## 📱 Features im Detail

### Dashboard
- Monatlicher Gewinn mit animierten Zahlen
- Lagerbestand-Übersicht
- Warenwert-Tracking
- Top-Brand-Analyse
- Verkaufskanal-Verteilung mit visuellen Charts

### Inventar
- Artikel-Liste mit Such- und Filterfunktion
- Status-Filter: Lager / Verkauft / Reserviert
- Schnellzugriff auf Artikel-Details
- Image-Upload und -Verwaltung

### Verkauf
- Einfacher Verkaufsprozess
- Automatische Profit-Berechnung
- Gebühren und Versandkosten-Tracking
- Verkaufskanal-Erfassung

## 🎨 Design System

Die App verwendet ein modernes Design System mit:
- **Glassmorphism** für moderne Card-Designs
- **Smooth Animations** für bessere UX
- **Custom Gradients** für visuelle Highlights
- **Responsive Design** für alle Bildschirmgrößen
- **Custom Color Palette** basierend auf Stone/Neutral Tones

## 📄 Lizenz

Dieses Projekt ist für den privaten Gebrauch bestimmt.

## 🤝 Beitragen

Bei Fragen oder Problemen, bitte ein Issue erstellen.

---

Made with ❤️ using Next.js and Supabase
