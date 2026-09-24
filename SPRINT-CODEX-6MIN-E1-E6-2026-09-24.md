# Sprint Codex — 6-Minuten-Tagebuch E1–E6 (Live Supabase v2.6.0)

**Datum:** 2026-09-24 (CEST / Europe/Berlin)  
**Für:** Codex (Implementierung)  
**Auftrag von:** Norbert via Grok Bot  
**Status:** offen  
**Basis-Review:** [`EXPERTEN-REVIEW-2026-09-24.md`](./EXPERTEN-REVIEW-2026-09-24.md)  
**Code-Stand Ausgang:** Commit `3fa98bd` · App-UI **2.6.0** · `sw.js` `CACHE_VERSION = 'v2.6.0'`

---

## 0. Einzeiler

Cloud-Export und Stats sind kaputt, Archiv ist kalender-first ohne Liste, Fotos ohne Galerie, PWA-Pfade unter GitHub Pages Subpath falsch — alles auf dem **live Supabase-Track v2.6.0** in **diesem** Clone reparieren und ausbauen. Kein PocketBase. Kein E2EE-Merge aus dem Experiment-Ordner.

---

## 1. Scope / Arbeitsorte

| Was | Wert |
|---|---|
| **Arbeitspfad (einzige Deploy-Quelle)** | `/Volumes/2tb/Codex playground/6min-tagebuch-github` |
| **Repo** | `git@github.com:BenditoT/6min-tagebuch.git` · Branch `main` |
| **Live URL** | https://benditot.github.io/6min-tagebuch/ |
| **Supabase Project Ref** | `uafiwndmlhluyzksqvdp` (eu-west-1) |
| **Supabase URL** | `https://uafiwndmlhluyzksqvdp.supabase.co` |
| **Review** | `./EXPERTEN-REVIEW-2026-09-24.md` (dieser Ordner) |
| **Nicht anfassen** | `/Volumes/2tb/Codex playground/6min tagebuch` (kaputtes Git, PocketBase/E2EE-Experimente v2.7/v2.8) |

### In Scope

- Nur Dateien im Clean Clone: vor allem `index.html`, `sw.js`, `manifest.json`, ggf. kleine Hilfsdateien/Tests **wenn** sie im Clone existieren oder neu und schlank hinzukommen.
- Live-Tabellen/Storage wie produktiv genutzt: `daily_entries`, `habits`, `habit_logs`, `weekly_reflections`, `challenge_reflections`, Storage-Bucket `daily-photos`.
- Demo-Modus (`localStorage` + IDB) und Cloud-Modus parallel grün halten.
- iOS Safari / iOS PWA (Homescreen) als führende Abnahmeplattform; Desktop Chrome als Zweitcheck.

### Out of Scope / Non-Goals

- **Kein PocketBase**, kein `pocketbase-client.js`, kein Merge aus `../6min tagebuch`.
- **Kein E2EE** aus `e2ee.js` / Experiment-Track — weder Import noch „halb reinziehen“. Echter E2EE nur als **separater späterer** Supabase-Sprint.
- Keine Service-Role im Frontend; Anon-Key bleibt public-by-design (nicht rotieren/loggens in Commits erweitern).
- Keine echten User-Diary-Inhalte in Logs, Commits, Reviews, Toasts, Test-Fixtures.
- Kein Force-Push, kein Reset echter Supabase-Daten, keine Schema-Löschmigration ohne expliziten Norbert-Gate.
- Kein Feature-Bloat (kein neues Backend, kein Vite-Umbau in diesem Sprint, kein Monolith-Split außer E6 optional und klein).
- Kein Deploy durch Codex — **Norbert** macht `git push` (siehe Abschnitt 14).

---

## 2. Ziele / Non-Goals (Produkt)

### Ziele (messbar)

1. **Cloud-JSON-Export** liefert echte Einträge/Habits/Reflexionen (kein Stub-Text als Datei) — Demo und Cloud.
2. **PDF/HTML-Druck** enthält alle Journal-Felder, Cloud-fähig, XSS-sicher (`escapeHtml`), iOS-PWA ohne totes `window.open`.
3. **Cloud-Stats** zählen korrekt über `daily_entries` (nicht tote Tabelle `entries`).
4. **Archiv Default = chronologische Liste** mit Kalender-Toggle; Suche v1; Race/Loading-Fix.
5. **Foto-Galerie** mit Monatsfilter, Lightbox prev/next, Löschen verdrahtet; Weg vom ewigen Base64-`localStorage`.
6. **PWA unter `/6min-tagebuch/`** startet/cacht korrekt (Manifest + SW relativ/absolut zum Subpath).
7. **Offline-Queue** wirklich verdrahtet; Privacy-Text ehrlich; Migration inkl. Fotos; Freeze-Policy klar.
8. Versionen und SW-Cache konsistent bump’en; manuelle Abnahme Demo+Cloud+iOS.

### Non-Goals

- Experimentelle v2.7/v2.8-Features aus dem anderen Ordner „nachziehen“.
- Verschlüsselter Export / Recovery-Code (älterer Juli-Plan) — nicht Teil E1–E6.
- Push-Notifications neu erfinden (höchstens E6: ehrlich deprecaten/dokumentieren).
- Foto-ZIP-Export (UX-Skizze „später“) — nur vorbereiten/platzhalterisch erwähnen, nicht liefern.

---

## 3. Prioritätsreihenfolge (verbindlich)

```text
E1 (Export P0)  ──start──►  parallel ab E1-Start: E4 (Stats + PWA-Pfade)
        │
        ▼
       E2 (Liste + Archiv-Race)
        │
        ▼
       E3 (Foto-Galerie)
        │
        ▼
       E5 (Offline-Queue + Privacy-Copy + Migration/Freeze)
        │
        ▼
       E6 (Hardening P2, nach Bedarf / Restzeit)
```

**Regel:** E1 zuerst anpacken (User-Pain + DSGVO Art. 20). E4 darf **sofort parallel** starten, sobald E1 begonnen ist (andere Dateizonen: Stats/Manifest/SW vs. Export-Handler) — Merge-Konfliktgefahr in `index.html` bewusst klein halten (getrennte Funktionen, eine Person/Agent synchronisiert). E2/E3 brauchen stabile Daten-APIs; E5 hängt an Save-Pfaden; E6 zuletzt.

---

## 4. Versionsplan (Vorschlag)

> Live ist **2.6.0**. Der Experiment-Ordner hat lokal schon „v2.7/v2.8 PocketBase“ — das ist **nicht** dieser Track. Hier bedeuten die Nummern wieder den **Supabase-Live-Track**.

| Release | Enthält | Wann | SemVer-Logik |
|---|---|---|---|
| **2.6.1** | **E1 + E4** (Export-Hotfix + Stats-Schema + Manifest/SW-Pfade + Privacy-Text-Mindestfix aus E5-Copy wenn trivial mitziehbar) | Erster Push nach Hotfix | Patch: kaputte Cloud-Pfade / PWA-Install reparieren |
| **2.7.0** | **E2 + E3** (Liste default + Galerie) | Zweiter Feature-Push | Minor: neue UX-Flächen |
| **2.7.1** | **E5** (+ kleine E6-Nachzüge) | Dritter Push | Patch: Offline/Wahrheit/Migration |
| **2.7.2+** | Rest **E6** | nach Bedarf | Patch Hardening |

### Pflicht bei jedem Bump

1. Settings-Anzeige Version in `index.html` (heute `2.6.0` ≈ Z. 4459).
2. `sw.js`: Kommentar + `CACHE_VERSION` (heute `'v2.6.0'`).
3. Kurzer Eintrag in Commit-Message; optional `CHANGELOG-vX.Y.Z.md` im Clone (nur wenn schon gepflegt — nicht aus Experiment-Ordner kopieren).
4. Nach Deploy: Hard-Reload / SW-Update-Banner einmal durchklicken; iOS-PWA ggf. vom Homescreen entfernen und neu hinzufügen wenn Manifest-`start_url`/`scope` geändert.

---

## 5. iOS PWA / GitHub Pages Constraints

Live liegt unter **Subpath** `https://benditot.github.io/6min-tagebuch/` — nicht Domain-Root.

| Thema | Ist (v2.6.0) | Soll |
|---|---|---|
| `manifest.json` `start_url` | `"/index.html"` | Relativ `./index.html` **oder** absolut `/6min-tagebuch/index.html` |
| `manifest.json` `scope` | `"/"` | `./` **oder** `/6min-tagebuch/` |
| `sw.js` `STATIC_ASSETS` | `'/'`, `'/index.html'` | `./`, `./index.html`, `./manifest.json`, Icons relativ |
| Notification / Icon-URLs | `'/icon-192.png'` | relativ zum Scope |
| CSP `img-src` | `self` + `data:` + googleusercontent — **kein** `*.supabase.co` | Vor Signed-URL-Fotos CSP erweitern (`https://*.supabase.co`) — sonst brechen Storage-URLs |
| Download | `a[download]` oft wirkungslos in iOS Standalone | Feature-Detect → `navigator.share({ files })` / Share-Sheet; Fallback sichtbarer Link |
| `window.open` | oft `null` in iOS PWA | PDF: Blob-URL im **gleichen** Dokument drucken oder Share; nie nur auf Popup setzen |
| Safe Area | `viewport-fit=cover` schon da | Liste/Galerie: bottom Tab-Bar + Notch beachten |
| SW Update | `skipWaiting` + Banner | Nach Pfad-Fix: alte Root-Caches nicht „fremdes“ Domain-Zeug löschen — nur app-eigene Cache-Namen (Pattern `static-v*` / `runtime-v*` der App) |

**Abnahme-Geräte:** iPhone Safari Browser-Tab **und** „Zum Home-Bildschirm“ Standalone. Android/Chrome nice-to-have.

---

## 6. Privacy-Copy Fix (Pflicht, spätestens E5 — ideal schon in 2.6.1 mitziehen)

**Evidenz:** Datenschutz-Overlay ≈ Z. 4540+ behauptet Cloud-Daten „verschlüsselt“.  
**Realität dieses Tracks:** TLS + Supabase at-rest + RLS — **kein** Client-E2EE.

### Muss-Formulierungen (DE)

- **Statt** „Ende-zu-Ende verschlüsselt“ / „nur du kannst lesen“ (wenn so formuliert):
  - „Übertragung per **HTTPS/TLS**. Speicherung auf Supabase (**Server-seitig geschützt**, Verschlüsselung at rest beim Anbieter). Zugriffsschutz über **Login + Row Level Security (RLS)**.“
- Klarstellen: **Kein** Client-E2EE in v2.6.x / 2.7.x dieses Tracks.
- Optional ein Satz: „Clientseitige Ende-zu-Ende-Verschlüsselung ist ein separates späteres Feature und aktuell nicht aktiv.“
- Export-Hinweis: Nutzer kann Daten als JSON/HTML exportieren (Art. 20) — erst **nach** E1 wahr.

### Darf nicht

- Versprechen aus dem Experiment-Ordner (`e2ee.js`) als live darstellen.
- „Unlesbar für den Server“ behaupten.

---

## 7. Datenmodell-Reminder (nur live Schema)

Cloud-CRUD nutzt u. a.:

- `daily_entries`: `entry_date`, `morning` / `evening` (JSONB), nicht `entries` + `entry_type`
- Habits: `habits`, `habit_logs`
- Reflexionen: `weekly_reflections`, `challenge_reflections`
- Fotos: Storage `daily-photos` + heute zusätzlich Base64 in `localStorage` (`photo_${userId}_${date}`) — E3 entschärfen

Demo: `DEMO_DATA` / `6min_demo_data` (Keys nicht aus Juli-Experiment blind überschreiben — im **github-Clone** den dortigen Ist-Stand lesen).

---

# Paket E1 — Export reparieren (P0-1, P0-2)

**Prio:** P0 · **Aufwand:** ~1 Tag · **Release:** **2.6.1** (mit E4)  
**Owner:** Codex

## Ziel

Cloud- und Demo-Nutzer bekommen **echte**, vollständige Exporte. Kein Stub-String als JSON-Datei. Kein leeres PDF. Toast nur bei Erfolg. iOS teilt Dateien zuverlässig.

## Kontext / Evidenz (aus Review)

| Thema | Ort / Symbol |
|---|---|
| JSON-Stub Cloud | `SettingsScreen` ≈ Z. 4366–4379 — Cloud speichert Text „nur im Demo-Modus…“, Toast trotzdem Erfolg |
| PDF leer Cloud | ≈ Z. 4384–4416 — `const entries = dataService.isDemo ? DEMO_DATA.entries \|\| {} : {}` |
| Unvollständige Demo-Felder | fehlend u. a. `wonderful`, `learned`, `improve` |
| XSS Print | `printWindow.document.write` ohne `escapeHtml` |
| iOS Popup | `window.open` → oft `null` |

Verwandte APIs zum Nutzen/Erweitern: `getAllEntryDates` (≈ Z. 2259), `getEntries`, Habits-/Reflection-Getter, `escapeHtml` / `formatEntryContent`.

## Konkrete Schritte

1. **Neue DataService-Methode** `exportAllData()` (Name darf leicht abweichen, aber eine Quelle):
   - Demo: aus kanonischem Demo-Store lesen.
   - Cloud: `daily_entries` (alle Felder), `habits` + `habit_logs`, `weekly_reflections`, `challenge_reflections`; Foto-Metadaten (Datum + Storage-Pfad / Flag), **keine** riesigen Base64-Blobs Pflicht in v1 — Metadaten + Hinweis „Fotos separat in Galerie/Storage“.
   - Envelope: `{ schemaVersion, exportedAt (ISO), mode: 'demo'|'cloud', appVersion, entries, habits, reflections, photosMeta }`.
2. **JSON-Download/Share** aus `exportAllData()`; leeres Ergebnis → Warn-Toast, **kein** Erfolgs-Toast.
3. **HTML/PDF-Druck** aus derselben Datenquelle:
   - Alle Journal-Keys (Morgen/Abend inkl. wonderful/learned/improve/good_deed etc. — am Ist-Schema orientieren).
   - Jeden Text durch `escapeHtml`.
   - iOS: kein alleiniges `window.open`; Blob + gleiches Fenster / Share.
4. Feature-Detect Download:
   - Desktop: `a.download` ok.
   - iOS: `navigator.canShare` / `navigator.share` mit `File`; sonst sichtbarer „Tippen zum Teilen/Speichern“-Pfad.
5. UI-Copy Settings: „Export (JSON)“ / „Als HTML drucken“ — kein „nur Demo“.
6. Fehlerpfade: Netzfehler Cloud → klarer Toast; Partial fail → kein Erfolgs-Toast.

## Dateien

- `index.html` — `DataService`, `SettingsScreen`, Utils `escapeHtml`
- ggf. keine neuen Dateien nötig (Monolith beibehalten)

## Tests / Abnahme

- [ ] Demo: ≥1 Morgen+Abend mit allen Feldern → JSON enthält sie; HTML-Druck zeigt sie escaped.
- [ ] Cloud (Testaccount, synthetisch): Export JSON Dateigröße > Stub; enthält `entry_date`s die in UI sichtbar sind.
- [ ] Cloud mit 0 Einträgen: Warnung, kein „Daten exportiert“.
- [ ] iOS Safari + iOS PWA: Share-Sheet oder nutzbarer Fallback; kein Silent-Fail.
- [ ] Mutwillig `<script>` in Demo-Feld → Print zeigt escaped, führt nichts aus.
- [ ] Erfolgs-Toast nur nach erfolgreichem Blob.

## Rollback

- Revert Commit; `CACHE_VERSION` zurück; Nutzer behalten Cloud-Daten unverändert (Export ist read-only).

## Definition of Done

- [ ] Stub-String-Pfad entfernt.
- [ ] Eine Datenquelle für JSON + Print.
- [ ] iOS-Pfad getestet oder mit begründetem Fallback.
- [ ] Version **2.6.1** vorbereitet (mit E4) oder zumindest Export-Teil merge-ready.
- [ ] Keine Diary-Inhalte in git/logs.

---

# Paket E4 — Cloud-Stats + PWA-Pfade (P0-3, P1-3)

**Prio:** P0/P1 · **Aufwand:** ~0.5–1 Tag · **parallel ab E1-Start** · **Release:** **2.6.1**

## Ziel

Stats zeigen echte Zahlen im Cloud-Modus. Homescreen-Start und SW cachen die App unter `/6min-tagebuch/`, nicht Domain-Root.

## Kontext / Evidenz

| Thema | Ort / Symbol |
|---|---|
| Falsche Tabelle | `calculateStats` ≈ Z. 4232–4275 — `.from('entries')`, `entry_type` |
| Produktiv-CRUD | überall `daily_entries` + `entry_date`, JSON `morning`/`evening` |
| Manifest | `start_url: "/index.html"`, `scope: "/"` |
| SW | `STATIC_ASSETS` Root-Pfade; Notification-Icon absolute Root ≈ Z. 4674 |

## Konkrete Schritte

1. `calculateStats` Cloud-Zweig auf `daily_entries` umbiegen; Mood/Wortzahlen aus JSON-Feldern wie Demo-Pfad.
2. `manifest.json`: `start_url` + `scope` für Subpath (relativ bevorzugen).
3. `sw.js`: Asset-Liste relativ; bei Install nur App-URLs; Cache-Bereinigung nur eigene Prefixe.
4. Icon-/Notification-Pfade relativ.
5. Smoke: frischer Incognito-Besuch der Live-URL nach Deploy; Application-Tab Manifest scope prüfen.
6. Optional schon jetzt Privacy-Mindestkorrektur (Abschnitt 6) mitnehmen — spart E5 Touch.

## Dateien

- `index.html` (`calculateStats`, Icon-URLs)
- `manifest.json`
- `sw.js`

## Tests / Abnahme

- [ ] Cloud-Account mit bekannten N Einträgen → Stats ≠ 0 (wo Daten existieren).
- [ ] Demo-Stats unverändert plausibel.
- [ ] Manifest `start_url` resolved unter `/6min-tagebuch/`.
- [ ] SW precache 200 für App-Shell (nicht github.io Root 404).
- [ ] Offline-Reload der App-Shell nach erstem Besuch (soweit Network-First-Politik es zulässt — Verhalten dokumentieren).

## Rollback

- Manifest/SW revert → Nutzer ggf. PWA neu hinzufügen; Stats-Query revert.

## Definition of Done

- [ ] Kein `.from('entries')` mehr im Stats-Pfad.
- [ ] Subpath-PWA manuell verifiziert (Checkliste).
- [ ] Gemeinsamer Tag/Commit mit E1 als **v2.6.1**.

---

# Paket E2 — Chronologische Liste (P1-1) + Archiv-Race (P1-4)

**Prio:** P1 · **Aufwand:** ~1–1.5 Tage · **Release:** **2.7.0** (mit E3)  
**Abhängigkeit:** E1 ideal fertig (keine Blocker); E4 ideal fertig

## Ziel

Archiv-Tab öffnet als **Liste** (neueste zuerst). Kalender bleibt per Toggle. Loading/Race funktioniert. Datumsstrings `YYYY-MM-DD` ohne UTC-Verschiebung.

## Kontext / Evidenz

- Tab Archiv = nur `ArchiveScreen` Kalender ≈ Z. 3691–3880.
- `getAllEntryDates()` ≈ Z. 2259 existiert, wird für Streak genutzt, **nicht** für Liste.
- `_archiveRequestId = 0` **innerhalb** von `ArchiveScreen` → jeder Render neuer Counter; Spinner-Guard tot.
- `getEntries(date)` ≈ Z. 2139: `new Date(date).toISOString().split('T')[0]` → TZ-Bug.

## Konkrete Schritte

1. API: `listEntriesPage({ limit, beforeDate })` oder batched Nutzung von `getAllEntryDates` + `getEntries`; Cloud: eine Query `order('entry_date', { ascending: false })` mit Range.
2. UI Segmented Control: **[Liste] [Kalender]** — Default **Liste**.
3. Listenzeile: Datum · Icons Morgen/Abend/Foto · Preview-Text (1 Zeile, escaped).
4. Tap → bestehenden Detail-Block reuse (kein zweites Detail-Modell).
5. Infinite scroll / „Mehr laden“.
6. Suche v1: Client-Filter über geladene Seite + optional Nachladen; Cloud später `ilike` wenn JSON-Search hart — v1 darf clientseitig paginiert filtern, UX klar („durchsucht geladene Einträge“ oder Vollscan mit Limit).
7. `_archiveRequestId` (oder AbortController) auf **Modul-Scope** heben; Loading-UI an echten In-flight-State.
8. Date-Fix: wenn Input schon `^\d{4}-\d{2}-\d{2}$`, unverändert durchreichen.
9. Tab-Label optional: „Archiv“ behalten; Icon darf Liste+Kalender mental tragen.

### Acceptance Criteria aus UX-Skizze „Liste“ (expandiert)

- [ ] Beim Öffnen Archiv: Liste sichtbar ohne Extra-Tap.
- [ ] Gruppenköpfe: „Heute“, „Gestern“, sonst lokalisiertes Datum (de-DE).
- [ ] Zeile zeigt vorhandene Teile: 🌅 wenn morning content, 🌙 evening, 📸 wenn Foto-Flag/Meta.
- [ ] Preview = erster nicht-leerer Dankbarkeits-/Text-Schnipsel, max ~80–100 Zeichen, `escapeHtml`.
- [ ] Leerer Tag in Suche/Long-press: „Nachtragen“ nutzt bestehenden Journal-Flow.
- [ ] Kalender-Toggle erhält Monats-Dots (`getEntryDatesForMonth`) wie bisher.
- [ ] Schnelle Monats-/Tag-Klicks erzeugen kein vertauschtes Detail (Race-Test).
- [ ] Berlin-TZ: Eintrag am lokalen Tag T erscheint nicht als T−1.

## Dateien

- `index.html` — `DataService`, `ArchiveScreen`, Modul-Scope State, Tab-Bar nur wenn nötig

## Tests / Abnahme

- [ ] Demo 30+ synthetische Tage: Scroll + Detail.
- [ ] Cloud: Liste zeigt dieselben Daten wie Kalender-Dots.
- [ ] Race: Spam-Klicks Kalender/Liste — Loading korrekt, finaler State konsistent.
- [ ] Gerät Europe/Berlin: Datumsrand-Fälle (23:30 / 00:30).

## Rollback

- Feature-Flag oder Revert: Default wieder Kalender; Liste-Code totlegen.

## Definition of Done

- [ ] Default = Liste; Kalender sekundär.
- [ ] Race + Date-String Fixes merged.
- [ ] Such-v1 dokumentiert (was sie kann/nicht kann).

---

# Paket E3 — Foto-Galerie (P1-2)

**Prio:** P1 · **Aufwand:** ~1.5–2 Tage · **Release:** **2.7.0** (mit E2)

## Ziel

Nutzer browsen alle Tagesfotos, filtern nach Monat, löschen, swipen in Lightbox. Kein dauerhaftes Base64-Vollbild in `localStorage` als Primärspeicher.

## Kontext / Evidenz

- `saveDailyPhoto` / `getDailyPhoto` / `deleteDailyPhoto` ≈ Z. 2628–2694 — UI löschen unverdrahtet (P2-4).
- Kein `listPhotos`; nur Dashboard „Bild des Tages“ + Archiv-Detail + Lightbox.
- Cloud: Base64 parallel `localStorage` → Quota ~5MB, ITP-Risiko.
- CSP blockt `*.supabase.co` Images — relevant sobald Signed URLs.

## Konkrete Schritte

1. `listDailyPhotos()`: Storage `.list(userId)` und/oder Ableitung aus Entry-Dates + Existenz-Check; Demo: Keys aus Store/IDB.
2. Optional leichtgewichtige Meta (`has_photo` auf Entry oder separates Mapping) — **keine** neue Supabase-Tabelle ohne Norbert-OK; Prefer Storage list + Entry dates.
3. Galerie-UI: 3–4 Spalten, lazy load, Monats-Dropdown.
4. Einstieg: Dashboard-Link „Alle Fotos →“; optional Segment in Archiv „Fotos“ oder eigener Screen im App-State.
5. Lightbox: prev/next (Swipe + Buttons), Share, **Löschen** → `deleteDailyPhoto` + UI-Refresh + Confirm.
6. Cache-Strategie: Memory/IDB Blob-Cache; `localStorage` Base64 nicht mehr als langfristige Quelle beschreiben/schreiben (Migration: alte Keys beim Lesen einmalig übernehmen dann räumen — vorsichtig, synthetisch testen).
7. CSP: `img-src` um `https://*.supabase.co` erweitern **bevor** Signed URLs live gehen.
8. Shared State: Dashboard-Lightbox nicht mehr über `archiveSelectedPhoto` kreuzen (P2-3) — getrennte State-Keys.

### Acceptance Criteria aus UX-Skizze „Galerie“

- [ ] Grid zeigt nur Tage mit Foto; leere Zellen nicht als kaputte Bilder.
- [ ] Monatsfilter wechselt ohne Full-App-Reload.
- [ ] Tap öffnet Lightbox mit Datum-Caption.
- [ ] Swipe/Buttons wechseln zum zeitlich prev/next **vorhandenen** Foto.
- [ ] Löschen entfernt Storage-Objekt + UI-Eintrag; Undo optional nicht nötig, Confirm Pflicht.
- [ ] iOS: Galerie-Scroll butterig genug (Thumbnails klein, Fullsize nur Lightbox).
- [ ] Nach Quota-Altlast: App startet ohne QuotaExceeded beim Öffnen Galerie.

### Acceptance Criteria Export-Skizze (Schnittstelle E1, Rest später)

- [ ] JSON-Metadaten listen Foto-Daten (E1).
- [ ] „Nur Fotos ZIP“ = Non-Goal; UI darf „demnächst“ nicht als funktionierenden Button lügen.

## Dateien

- `index.html` — DataService Foto-APIs, neue `PhotoGalleryScreen` oder Archiv-Segment, CSP Meta, Dashboard-Link
- ggf. `sw.js` unberührt außer Cache-Version-Bump mit 2.7.0

## Tests / Abnahme

- [ ] Demo: 3 Fotos verschiedene Tage → Grid + Delete.
- [ ] Cloud: Upload via bestehende Kamera/Galerie-Inputs → erscheint in Galerie nach Refresh.
- [ ] CSP: Signed URL oder Storage-Öffentlichkeitsvariante wie implementiert — Bild lädt.
- [ ] Kein Commit mit echten Privatsphäre-Fotos.

## Rollback

- Galerie-Route entfernen; alte getDailyPhoto-Pfade bleiben.

## Definition of Done

- [ ] Browse + Delete + Lightbox Navigation.
- [ ] localStorage nicht mehr Primärspeicher für Fullsize.
- [ ] Teil von **v2.7.0** mit E2.

---

# Paket E5 — Offline-Queue echt + Copy + Migration/Freeze (P1-5, P1-6, P1-7)

**Prio:** P1 · **Aufwand:** ~1 Tag · **Release:** **2.7.1**

## Ziel

Offline schreiben queued wirklich. Privacy-Text ehrlich. Demo→Cloud migriert Fotos. Streak-Freeze-Policy für Cloud entschieden und UI-konsistent.

## Kontext / Evidenz

- `_queueSync` / `processSyncQueue` ≈ Z. 1972–1988; `online` Listener ≈ Z. 4657 ruft Queue — aber **`_queueSync` nie aufgerufen**.
- `saveEntry` Netzfehler → `false`, kein Enqueue.
- Privacy Overlay ≈ Z. 4540+ vs. kein E2EE.
- `migrateToCloud` ≈ Z. 1994–2018 ohne photos.
- Dashboard `freezesRemaining = dataService.isDemo ? … : 0` ≈ Z. 3055.
- `processSyncQueue` löscht Queue vor Erfolg (P2-6) — mitfixen.

## Konkrete Schritte

1. Bei Cloud-Fehler / `navigator.onLine === false`: lokale Zwischenpersistenz + `_queueSync({type, payload})` von `saveEntry`, Habit-Toggle, Reflection-Save.
2. `processSyncQueue`: Eintrag erst nach bestätigtem Success entfernen; Fail belassen + Backoff; nie stille Datenvernichtung.
3. UI: dezentes „Offline — wird synchronisiert“ / Badge an Tab.
4. Privacy-Copy nach Abschnitt 6.
5. `migrateToCloud`: Fotos mitmigrieren (Storage Upload aus Demo-Blobs); Teilfehler → lokale Daten behalten (schon Review-Geist).
6. **Freeze-Policy entscheiden (Codex schlägt vor, Norbert bestätigt bei Unklarheit):**
   - **Empfehlung A (einfach):** Cloud-UI Freeze-Copy entfernen/ausblenden bis Backend-Support existiert.
   - **Empfehlung B:** `user_settings`/Spalte persistieren — nur wenn Schema klar und RLS ok; sonst A.
7. Manuelle Offline-Tests: Airplane Mode, Eintrag, Online, erscheint in Cloud.

## Dateien

- `index.html` — DataService Sync, Settings Privacy, Dashboard Freeze, migrateToCloud

## Tests / Abnahme

- [ ] Offline speichern → Queue length ≥ 1; Online → Queue leer und Cloud hat Zeile.
- [ ] Queue-Fail simulieren → Eintrag bleibt in Queue.
- [ ] Privacy-Text ohne E2EE-Lüge.
- [ ] migrateToCloud synthetisch inkl. 1 Foto.
- [ ] Freeze-UI matched Policy.

## Rollback

- Queue-Calls wieder entfernen (Feature bleibt „ehrlich offline fail“); Copy revert.

## Definition of Done

- [ ] `_queueSync` referenziert von Save-Pfaden.
- [ ] Privacy + Migration + Freeze erledigt.
- [ ] Tag **v2.7.1**.

---

# Paket E6 — Hardening (P2, nach Bedarf)

**Prio:** P2 · **Aufwand:** Restzeit · **Release:** 2.7.2+ oder mit 2.7.1 wenn trivial

## Ziel

Kleine Schulden ohne Scope-Creep.

## Backlog (aus Review-Tabelle)

| ID | Maßnahme |
|---|---|
| P2-1 | Demo-Export Schema/`exportedAt` (falls E1 nicht 100 % abdeckt) |
| P2-2 | `_validateContent`: `good_deed` in `stringFields` ≈ Z. 2163–2170 |
| P2-3 | Lightbox-State trennen (mit E3) |
| P2-4 | Delete-Foto UI (mit E3) |
| P2-5 | Notifications: iOS-Limits dokumentieren oder Interval entschärfen ≈ Z. 4668+ |
| P2-6 | Queue Success-before-delete (mit E5) |
| P2-7 | Habit-ID Parsing robust (nicht `split('_')` fragil) |
| P2-8 | Anon-Key nur truncated in Docs — **nicht** commit-kommentieren im Klartext neu |
| P2-9 | Optional Mini-Module-Split nur wenn Zeit — **kein** Pflicht-Bundler |
| P2-10 | Tab „Einstellungen“ statt „Settings“ |
| P2-11 | Print escape (E1) |
| P2-12 | Explizit: Experiment-Ordner nicht mergen — Check in PR-Beschreibung |

## DoD E6

- [ ] Mindestens P2-2, P2-10 erledigt wenn Zeit.
- [ ] Keine neuen P0/P1 Regressionen.

---

## 8. Übergreifende Abnahme-Matrix (vor jedem Push)

| Check | E1 | E4 | E2 | E3 | E5 |
|---|---|---|---|---|---|
| Demo Smoke Morgen/Abend/Habit | x | x | x | x | x |
| Cloud Login Session | x | x | x | x | x |
| Export JSON | x | | | | |
| Export/Print iOS | x | | | | |
| Stats Cloud ≠ 0 | | x | | | |
| PWA Install Subpath | | x | | | |
| Liste default | | | x | | |
| Galerie + Delete | | | | x | |
| Offline Queue | | | | | x |
| Privacy Copy | (ideal) | (ideal) | | | x |
| SW Version Banner | x | x | x | x | x |
| Keine echten Diary-Dumps | x | x | x | x | x |

---

## 9. Risiken & Leitplanken (Codex)

1. **Supabase only** — Tabellen wie live.
2. **Nicht** PocketBase / **nicht** `e2ee.js` aus `../6min tagebuch`.
3. Monolith `index.html` (~5k LOC): kleine, reviewbare Diffs; Funktionen benennen statt Copy-Paste-Drift.
4. RLS nicht lockern; keine service_role.
5. Nach Fixes: manuell Demo **und** Cloud; 2 Fotos; iOS Safari + PWA.
6. Bei Schema-Zweifel: stoppen, Norbert fragen — nicht raten und migrieren.

---

## 10. Startauftrag Copy-Paste für Codex

```text
Du implementierst den Sprint SPRINT-CODEX-6MIN-E1-E6-2026-09-24.md im Ordner:

/Volumes/2tb/Codex playground/6min-tagebuch-github

Lies zuerst vollständig:
- EXPERTEN-REVIEW-2026-09-24.md
- SPRINT-CODEX-6MIN-E1-E6-2026-09-24.md

Regeln:
- NUR dieser Clone (Live-Track Supabase v2.6.0 → Bumps laut Sprint).
- KEIN PocketBase, KEIN Merge/Copy aus "../6min tagebuch" (E2EE/PocketBase-Experimente).
- Keine echten Tagebuchinhalte loggen oder committen.
- Norbert pusht selbst — du commitest lokal nur wenn ausdrücklich verlangt; sonst Diff bereitmachen.
- Reihenfolge: E1 starten, E4 parallel, dann E2 → E3 → E5 → E6.
- Version: 2.6.1 = E1+E4; 2.7.0 = E2+E3; 2.7.1 = E5.

Starte mit E1 (exportAllData + Settings JSON/PDF) und lege parallel E4-Patch (calculateStats + manifest/sw) an.
Melde nach jedem Paket: geänderte Dateien, manuelle Testnotiz, offene Risiken.
```

---

## 11. HANDOVER-Hinweis (für `../6min tagebuch/HANDOVER.md`)

Oben einfügen (Kurzstatus): Live-Arbeit läuft über Clean Clone + diesen Sprint; Experiment-Ordner bleibt gesperrt für Deploy. Siehe Abschnitt „HANDOVER-Update“ unten — Datei wird mit diesem Sprint angelegt/aktualisiert.

---

## 12. Referenzen

- Review: `./EXPERTEN-REVIEW-2026-09-24.md`
- Clone-Hinweis: `./ARBEITEN-HIER.md`
- Wiederherstellung Kontext: `../6min tagebuch/WIEDERHERSTELLUNG-2026-09-24.md`
- Live: https://benditot.github.io/6min-tagebuch/
- Supabase: `uafiwndmlhluyzksqvdp`

---

## 13. Commit-Message-Vorlagen (wenn Code fertig)

```text
v2.6.1: Export Cloud+Demo echt, Stats daily_entries, PWA Subpath-Pfade

v2.7.0: Archiv-Liste default, Foto-Galerie, Archiv-Race/Date-Fixes

v2.7.1: Offline-Queue verdrahtet, Privacy-Copy ehrlich, Migration Fotos, Freeze-Policy
```

---

## 14. Ready-to-paste: Git für Norbert

### A) Optional — diesen Sprint + Review jetzt committen (Docs only)

```bash
cd "/Volumes/2tb/Codex playground/6min-tagebuch-github"
git status
git add EXPERTEN-REVIEW-2026-09-24.md SPRINT-CODEX-6MIN-E1-E6-2026-09-24.md ARBEITEN-HIER.md
git commit -m "$(cat <<'EOF'
docs: Experten-Review 2026-09-24 + Sprint Codex E1–E6

Live-Track Supabase v2.6.0; Implementierungsplan Export/Liste/Galerie/PWA.
EOF
)"
git status
# Push nur wenn gewünscht:
# git push origin main
```

### B) Nach Code v2.6.1 (E1+E4)

```bash
cd "/Volumes/2tb/Codex playground/6min-tagebuch-github"
git status
git diff --stat
git add index.html sw.js manifest.json
# ggf. CHANGELOG falls angelegt:
# git add CHANGELOG-v2.6.1.md
git commit -m "$(cat <<'EOF'
v2.6.1: Export repariert, Cloud-Stats, PWA-Pfade unter /6min-tagebuch/

JSON/PDF aus echter Datenquelle; calculateStats → daily_entries;
manifest/sw relativ zum GitHub-Pages-Subpath.
EOF
)"
git push origin main
```

### C) Nach Code v2.7.0 (E2+E3)

```bash
cd "/Volumes/2tb/Codex playground/6min-tagebuch-github"
git add index.html sw.js
git commit -m "$(cat <<'EOF'
v2.7.0: Archiv-Liste als Default, Foto-Galerie, Race- und Datumsfixes

Kalender bleibt Toggle; Galerie mit Lightbox/Löschen; SW-Cache-Bump.
EOF
)"
git push origin main
```

### D) Nach Code v2.7.1 (E5)

```bash
cd "/Volumes/2tb/Codex playground/6min-tagebuch-github"
git add index.html sw.js
git commit -m "$(cat <<'EOF'
v2.7.1: Offline-Queue echt, Privacy-Copy ohne E2EE-Lüge, Migration inkl. Fotos

Freeze-Policy Cloud konsistent; CACHE_VERSION bump.
EOF
)"
git push origin main
```

**Hinweis:** Pages baut von `main`. Nach Push 1–2 Min warten, dann Live hard-reload / SW-Update. iOS-PWA bei Manifest-Änderung neu zum Homescreen hinzufügen.

---

*Ende Sprint-Doc — abgeleitet 1:1 aus EXPERTEN-REVIEW-2026-09-24.md, erweitert zu lauffähigen Paketen für Codex. Status: offen.*
