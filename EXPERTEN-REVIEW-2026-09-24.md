# Experten-Review — 6-Minuten-Tagebuch PWA
**Datum:** 2026-09-24 (CEST)  
**Track:** GitHub `main` / Live Pages = **v2.6.0 + Supabase**  
**Quellen:** Clean Clone `/Volumes/2tb/Codex playground/6min-tagebuch-github` · Live https://benditot.github.io/6min-tagebuch/  
**Methode:** Code-/UX-Review (synthetic). **Keine** echten Tagebuchtexte aus Supabase/DB gelesen.  
**Scope-Hinweis:** Ordner `../6min tagebuch` enthält spätere lokale Experimente (v2.7/v2.8 PocketBase, E2EE) — **nicht live**. Hier nur als Abgrenzung erwähnt.

---

## Kurzfazit

- Live-App ist eine solide Einzeldatei-PWA (Preact+htm, DataService Dual-Mode Demo/Cloud, SW v2.6.0) mit gutem Kernfluss Morgen/Abend + Habits + Reflexion.
- **Export ist für Cloud-Nutzer faktisch kaputt** (JSON-Stub + leeres PDF) — erklärt die User-Pain „Export buggy/incomplete“ und bricht Art. 20 DSGVO-Versprechen in der UI.
- **Alte Einträge nur über Kalender** (Tab „Archiv“) — keine chronologische Liste, keine Suche; User-Pain „einfache Liste“ ist berechtigt und ungelöst.
- **Fotos:** Upload + Tages-Lightbox ok, aber **keine Galerie**, keine Datumsfilter, Base64 in `localStorage` (Quota/Performance), kein Browse über alle Fotos.
- Weitere harte Bugs: Cloud-**Stats** falsche Tabelle `entries`, **PWA-Manifest/SW-Pfade** für GitHub-Pages-Subpath falsch, Archiv-**Race/Loading** defekt, Offline-Sync-Queue **tot** (`_queueSync` nie aufgerufen), Privacy-Text behauptet Verschlüsselung ohne E2EE auf diesem Track.
- **Explizit:** Weiterarbeit nur auf **Supabase-Track** (dieser Clone). Kein PocketBase-Mix aus dem Experiment-Ordner.

---

## Was live gut ist

| Bereich | Evidenz |
|--------|---------|
| Klarer Tagesrhythmus | `DashboardScreen` + `JournalScreen` mit Morgen/Abend-Fragen, Auto-Save on blur, Confetti |
| Dual-Mode DataService | `class DataService` — Demo (`localStorage`+IDB) und Cloud (`daily_entries`, RLS-orientiert) |
| iOS Foto-Eingabe | Getrennte Inputs Galerie vs. Kamera (`photo-input` / `photo-input-camera`, Capture nur auf Kamera) |
| Archiv-Grundfunktion | Kalender mit Monats-Dots (`getEntryDatesForMonth`), Detail + Bearbeiten/Nachtragen |
| SW-Grundlagen | Network-First für Dokumente, Mutations nicht gecacht, `skipWaiting` + Update-Banner |
| DSGVO-Löschung (Cloud) | `deleteAllUserData()` löscht entries/habits/logs/reflections/storage-Fotos |
| XSS-Grundschutz Anzeige | `escapeHtml` + `formatEntryContent` im Archiv-Detail |
| Auth-Flows | Email + Google OAuth, Session-Restore, Demo-Einstieg |

---

## App-Struktur (Map)

```
index.html (~5047 LOC, Monolith)
├── CSS (Design Tokens, Screens, Kalender, Foto, Habits)
├── Utils: importWithTimeout/Fallback, setTheme, IDB Demo-Backup, compressImage
├── class DataService
│   ├── Auth (OAuth/Email), Sync-Queue (unvollständig verdrahtet)
│   ├── daily_entries CRUD, Streak, Monthly dates
│   ├── weekly_reflections, challenge_reflections
│   ├── habits + habit_logs
│   └── daily-photos (Storage + localStorage Base64)
├── Screens: Auth, Onboarding, Dashboard, Journal, Archive(Calendar),
│            WeeklyReflection, Settings (+ Stats/Privacy Overlays), Feedback
├── App (Preact Component) — screen state + Tab-Bar
sw.js — CACHE_VERSION v2.6.0
manifest.json — start_url/scope problematisch für /6min-tagebuch/
```

**Navigation (4 Tabs):** Home · Archiv (Kalender) · Reflexion · Settings  
**Kein eigener Screen:** Export (nur Settings-Items), Foto-Galerie, Eintrags-Liste, Suche.

---

## Befunde nach Priorität

### P0 — Sofort / Sprint-Blocker

#### P0-1 · Cloud-JSON-Export ist ein Stub (User-Pain #1)
**Evidenz:** `SettingsScreen` ≈ Z. 4366–4379  
Im Cloud-Modus wird **kein** Datenabruf gemacht, sondern der String  
`Datenexport ist nur im Demo-Modus verfügbar…` als Datei gespeichert — und trotzdem Toast „Daten exportiert“.  
Demo speichert nur `DEMO_DATA` (ohne saubere Schema-Version, Fotos nur wenn in Demo-Objekt).  
**Impact:** Art. 20 UI-Lüge; Cloud-User exportiert Müll.  
**Fix-Richtung:** `getAllEntryDates` + `getEntries`/`select * from daily_entries`, Reflections, Habits, optional Foto-Metadaten → JSON; Fehler toast; iOS: Share API / Web Share File wo `a.download` scheitert.

#### P0-2 · PDF-Export Cloud immer leer; Demo unvollständig
**Evidenz:** ≈ Z. 4384–4416  
`const entries = dataService.isDemo ? DEMO_DATA.entries || {} : {};` → Cloud = `{}`.  
Auch Demo: fehlt `wonderful`, `learned`, `improve`; kein Escape → XSS im Print-Fenster; `window.open` oft `null` in iOS-PWA → Catch „fehlgeschlagen“.  
**Fix:** Cloud-Daten laden; alle Journal-Felder; `escapeHtml`; Fallback ohne Popup (Blob + print aktuelles Dokument / Share).

#### P0-3 · Cloud-Statistiken falsches Schema
**Evidenz:** `calculateStats` ≈ Z. 4232–4275  
Cloud nutzt `.from('entries').select('date, entry_type')` und `.select('content')…entry_type='morning'`.  
Produktiv-CRUD nutzt überall **`daily_entries`** mit `entry_date`, `morning`, `evening` (JSONB).  
Tabelle `entries` existiert so nicht → Stats bleiben 0 / leer.  
**Fix:** Queries an `daily_entries` + JSON-Felder angleichen (wie Demo-Pfad).

---

### P1 — Hoher User-Schmerz / Qualitätsblocker

#### P1-1 · Keine chronologische Eintragsliste (User-Pain #2)
**Evidenz:** Tab Archiv = nur `ArchiveScreen` Kalender (≈ Z. 3691–3880).  
API `getAllEntryDates()` existiert (≈ Z. 2259), wird für Streak genutzt, **nicht** für eine Liste.  
Kein Search, kein Infinite Scroll, kein „Letzte 30 Tage“.  
**User muss:** Monat wählen → Tag tippen → Detail — für „mal kurz scrollen“ zu schwer.  
**Fix:** siehe UX-Skizze „Liste“; Kalender sekundär (Toggle Liste|Kalender).

#### P1-2 · Foto-Browse fehlt (User-Pain #3)
**Evidenz:**  
- Speichern: `saveDailyPhoto` / `getDailyPhoto` / `deleteDailyPhoto` (≈ Z. 2628–2694)  
- UI: nur Dashboard „Bild des Tages“ + Archiv-Tagesdetail + Lightbox  
- **Kein** `listPhotos`, keine Galerie-Grid, kein Filter nach Monat  
- Cloud: Base64 zusätzlich in `localStorage` (`photo_${userId}_${date}`) → Quota (~5MB), langsame Renders, ITP-Risiko  
- CSP `img-src` erlaubt kein `*.supabase.co` — aktuell ok weil Data-URLs; würde signed URLs blocken  
**Fix:** Storage `.list(userId)` + Thumbnails (oder DB-Metadaten-Tabelle); Galerie-Screen; Lightbox mit Swipe prev/next; localStorage nur kurz-Cache oder IndexedDB Blobs.

#### P1-3 · PWA unter GitHub Pages Subpath falsch konfiguriert
**Evidenz:**  
- `manifest.json`: `"start_url": "/index.html"`, `"scope": "/"` — Live liegt unter `/6min-tagebuch/`  
- `sw.js` `STATIC_ASSETS`: `'/'`, `'/index.html'` (Root der Domain, nicht der App)  
- Notification-Icon: `icon: '/icon-192.png'` (≈ Z. 4674)  
**Impact:** Homescreen-Start kann 404/fremde Seite; SW cached falsche URLs; Offline brüchig.  
**Fix:** relative Pfade (`./`, `./index.html`) oder absolute `/6min-tagebuch/...`; Manifest `start_url`/`scope` anpassen; GH Pages base prüfen.

#### P1-4 · Archiv Request-Race / Loading kaputt
**Evidenz:** ≈ Z. 3731–3748 — `let _archiveRequestId = 0` **innerhalb** von `ArchiveScreen` (jeder Render neuer Counter).  
Loading-UI prüft `_archiveRequestId > 0` am **neuen** Render → bleibt praktisch immer 0 → Spinner nie sichtbar.  
Schnelle Klicks: Guards greifen nicht über Renders hinweg.  
Zusatz: `getEntries(date)` macht `new Date(date).toISOString().split('T')[0]` (≈ Z. 2139) — UTC-Verschiebung für Nicht-EU-Zonen.  
**Fix:** Modul-Scope Counter; Datumsstring unverändert durchreichen wenn schon `YYYY-MM-DD`.

#### P1-5 · Offline-First nur Attrappe
**Evidenz:** `_queueSync` / `processSyncQueue` (≈ Z. 1972–1988); Listener `online` ruft Queue auf — aber **`_queueSync` wird nirgends aufgerufen**.  
`saveEntry` bei Netzfehler → `false`, kein Queue-Enqueue.  
Auto-Save im Journal zeigt Fehler, hält Antworten nur im Modul-Scope-RAM.  
**Fix:** Bei Cloud-Fehler + offline → queueen + lokal merken; Queue nicht leeren bevor Ops bestätigt.

#### P1-6 · Privacy-Text vs. Realität (E2EE)
**Evidenz:** Datenschutz-Overlay ≈ Z. 4540+ behauptet Cloud-Daten „verschlüsselt“.  
Auf **diesem** Track (v2.6.0): Standard Supabase at-rest, **kein** Client-E2EE. E2EE liegt nur im **nicht-live** Experiment-Ordner (`e2ee.js`, v2.7/v2.8).  
**Fix:** Text korrigieren („Server-seitig geschützt / TLS + RLS“) oder E2EE bewusst später als separates Supabase-Feature — **kein** PocketBase-Import.

#### P1-7 · Migration Demo→Cloud ohne Fotos; Streak-Freeze nur Demo
- `migrateToCloud` (≈ Z. 1994–2018): entries/habits/reflections — **keine** `photos`.  
- Dashboard: `freezesRemaining = dataService.isDemo ? … : 0` (≈ Z. 3055) — Cloud-Freeze tot trotz UI-Copy.

---

### P2 — Weitere Bugs / UX-Schulden

| ID | Thema | Evidenz / Hinweis |
|----|--------|-------------------|
| P2-1 | PDF/JSON Demo: unvollständige Felder, kein Schema/`exportedAt` | Settings Export |
| P2-2 | `_validateContent` ohne `good_deed` in `stringFields` | ≈ Z. 2163–2170 |
| P2-3 | Dashboard-Lightbox teilt `archiveSelectedPhoto` mit Archiv | ≈ Z. 3223–3226, 3481 |
| P2-4 | Kein Foto löschen in UI (nur DataService-API) | `deleteDailyPhoto` unverdrahtet |
| P2-5 | Notifications: `setInterval` 60s Poll statt sinnvoller Scheduling; iOS PWA stark limitiert | ≈ Z. 4668+ |
| P2-6 | Sync-Queue löscht Queue vor Erfolg (Datenverlust bei Fail) | `processSyncQueue` |
| P2-7 | Habit-ID Parsing `key.split('_')` fragile wenn IDs Underscores haben | `getHabits` Demo |
| P2-8 | Anon-Key hardcoded im Client (üblich für Supabase, aber RLS muss wasserdicht bleiben) | ≈ Z. 2766–2767 — in Docs nur truncated erwähnen |
| P2-9 | Monolith 5k LOC → Regressionen (Export/Stats Schema-Drift) | Struktur |
| P2-10 | Tab-Label „Settings“ statt „Einstellungen“; Archiv-Icon Kalender verstärkt Kalender-Mental-Model | Tab-Bar ≈ Z. 4921 |
| P2-11 | Escape bei `printWindow.document.write` fehlt | PDF |
| P2-12 | Experiment-Ordner PocketBase/E2EE **nicht** mergen | `../6min tagebuch` |

---

## Empfohlene UX-Skizzen

### A) Chronologische Liste (ersetzt Kalender als Default)

```
┌ Archiv ──────────────────┐
│ [Liste] [Kalender]  🔍   │  ← Segmented Control
│                          │
│ Heute                    │
│ 🌅 Morgen · 🌙 Abend · 📸│
│ „Dankbar für …“ Preview  │
│                          │
│ Gestern                  │
│ 🌙 Abend                 │
│                          │
│ Mo, 22. Sep              │
│ 🌅 · 🌙 · 📸             │
│ … infinite scroll        │
└──────────────────────────┘
Tap → bestehendes Entry-Detail (reuse Archive detail block)
Long-press / Button → Nachtragen wenn leer
Suche: Volltext über morning/evening JSON (Cloud: ilike/filter clientseitig paginiert)
```

**Daten:** `getAllEntryDates()` sort desc → batched `getEntries` (oder neues `listEntries({limit, before})` mit einer Query `order entry_date desc`).

### B) Foto-Galerie

```
┌ Fotos ───────────────────┐
│ Sep 2026          ▼ Monat│
│ ┌──┐ ┌──┐ ┌──┐ ┌──┐     │
│ │📸│ │📸│ │  │ │📸│     │  3–4 Spalten, lazy
│ └──┘ └──┘ └──┘ └──┘     │
│ Tap → Lightbox           │
│ ← → Swipe zwischen Tagen │
│ Share / Löschen          │
└──────────────────────────┘
```

Einstieg: Dashboard-Thumbnail „Alle Fotos →“ + optional Tab oder Archiv-Segment „Fotos“.

### C) Export (Settings)

```
Meine Daten exportieren
○ JSON (vollständig: Einträge, Habits, Reflexionen, Foto-Metadaten + ZIP optional)
○ HTML/PDF-Druck (alle Felder, Cloud-fähig)
○ Nur Fotos (ZIP) — später

[Export starten]
Fortschritt · bei iOS: Share-Sheet statt silent download
Erfolg erst nach echtem Blob; Fehler klar („0 Einträge“ / Netz)
```

---

## Vorgeschlagene Sprint-Pakete (für spätere Umsetzung)

> Implementierung **nur** in `6min-tagebuch-github` → Push `main` → GitHub Pages.  
> **Kein** PocketBase, kein Merge aus `6min tagebuch` Experimenten.

### E1 — Export reparieren (P0-1, P0-2) — ~1 Tag
1. `DataService.exportAllData()` → einheitliches JSON (Demo+Cloud).  
2. PDF/HTML aus derselben Quelle; alle Journal-Keys; escape.  
3. iOS: Feature-Detect `a.download` / `navigator.share`.  
4. Toast nur bei Erfolg; leerer Export = Warnung.

### E2 — Liste statt Kalender-First (P1-1) — ~1–1.5 Tage
1. `listEntriesPage` API.  
2. Archiv Default = Liste; Kalender Toggle.  
3. Race-Fix Archiv (`_archiveRequestId` modulweit); Date-String Fix.  
4. Optionale Suche (Client-Filter v1).

### E3 — Foto-Galerie (P1-2) — ~1.5–2 Tage
1. `listDailyPhotos()` via Storage list (+ parallel Entry-Dates mit Foto-Flag).  
2. Galerie-UI + Lightbox prev/next + Delete.  
3. Weg von ewigem Base64-localStorage → IDB oder nur Memory-Cache; CSP vorbereiten falls Signed URLs.

### E4 — Cloud-Stats + PWA-Pfade (P0-3, P1-3) — ~0.5–1 Tag
1. Stats auf `daily_entries` umbiegen.  
2. Manifest + SW Assets relativ zum Subpath.  
3. Smoke: Install von benditot.github.io/6min-tagebuch/.

### E5 — Offline-Queue echt + Copy-Fixes (P1-5, P1-6, P1-7) — ~1 Tag
1. `_queueSync` an saveEntry/toggleHabit/saveReflection.  
2. Privacy-Text ehrlich.  
3. migrateToCloud inkl. Fotos; Freeze-Policy Cloud entscheiden (entfernen oder persistieren).

### E6 — Hardening (P2) — nach Bedarf
Monolith splitten (module), XSS Print, Notifications realistisch deprecaten oder Document, Console-Sanitize Prod.

---

## Explizite Leitplanken für Codex

1. **Supabase only** — Tabellen wie live: `daily_entries`, `habits`, `habit_logs`, `weekly_reflections`, `challenge_reflections`, Storage `daily-photos`.  
2. **Nicht** PocketBase-Client, nicht `e2ee.js` aus dem Experiment-Ordner ohne eigenen Supabase-E2EE-Sprint.  
3. Keine echten User-Diary-Inhalte in Logs/Reviews committen.  
4. Secrets: Anon-Key bleibt public-by-design; Service-Role nie in Frontend.  
5. Nach Fixes: manuell Demo **und** Cloud Export + Liste + 2 Fotos auf iOS Safari/PWA prüfen.

---

## Top 5 für Parent/Stakeholder

1. **Cloud-Export JSON = Fake-Datei** (Settings) — P0  
2. **Cloud-PDF immer leer** — P0  
3. **Keine Eintrags-Liste**, nur Kalender — P1 / User-Pain  
4. **Keine Foto-Galerie / Browse** — P1 / User-Pain  
5. **Stats Cloud falsche Tabelle `entries`** + **Manifest/SW Root-Pfade** — P0/P1 Stabilität

---

## Pointer (optional)

Arbeitspfad / Review-Datei:
`/Volumes/2tb/Codex playground/6min-tagebuch-github/EXPERTEN-REVIEW-2026-09-24.md`

Im alten Ordner nur Hinweis: Experimente ≠ Live — siehe dort `WIEDERHERSTELLUNG-2026-09-24.md` und `ARBEITEN-HIER.md` im Clean Clone.

---

*Ende Review — Code-Stand Commit `3fa98bd` (v2.6.0), Live SHA-identisch lt. Wiederherstellungsnotiz 2026-09-24.*
