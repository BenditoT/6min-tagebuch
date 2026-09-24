# HANDOVER — 6-Minuten-Tagebuch (Live-Track Supabase)

**Stand:** 2026-09-24 · Arbeitsordner: `/Volumes/2tb/Codex playground/6min-tagebuch-github` (einzige Deploy-Quelle)
**Live:** https://benditot.github.io/6min-tagebuch/ (noch v2.6.0 bis Push)
**Plan:** `SPRINT-CODEX-6MIN-E1-E6-2026-09-24.md` · Befunde: `EXPERTEN-REVIEW-2026-09-24.md`

## Erledigt: v2.6.1 = E1 + E4 (+ Privacy-Text) — lokal, NICHT committet/gepusht
- **E1 Export:** `DataService.exportAllData()` = eine Quelle für JSON + Druck (Demo + Cloud: daily_entries, habits, habit_logs, weekly_reflections, challenge_reflections, Foto-Metadaten aus Storage). Envelope `schemaVersion/exportedAt/mode/appVersion`, ohne user_id. Leer → Warnung, Fehler → Fehler-Toast, Erfolg nur nach echter Datei.
- Druck: alle Felder, `escapeHtml`, verstecktes srcdoc-iframe statt `window.open`.
- Mobile/iOS: Sheet „Export bereit" mit Teilen (Web Share, frische Geste) / Drucken / Öffnen-Link.
- **E4:** `calculateStats` Cloud → `daily_entries` (+ `answers.week_rating`). Manifest `start_url ./index.html`, `scope ./`. SW: Assets relativ, Cache-Präfix `6min-`, räumt nur eigene Caches. Notification-Icon relativ.
- Privacy-Text: keine Verschlüsselungs-/E2EE-Behauptung mehr (TLS + at rest + RLS). Version 2.6.1 (`APP_VERSION`, sw `CACHE_VERSION`).

## Tests (Playwright, synthetische Daten, Fake-Supabase) — 24/24 grün
Desktop-Cloud-Export JSON/Druck, XSS escaped, Datum lokal, Stats-Werte, Fehlerpfad; iPhone-Emulation Sheet; leerer Export; SW-Scope + Precache unter Subpath; Manifest.

## Offen / Risiken
- **Echtes iPhone ungetestet:** (a) Teilen-Sheet für JSON, (b) „Drucken" per iframe in iOS-PWA — falls iOS die ganze Seite druckt: Fallback „Teilen" → HTML-Datei drucken. Nach Push prüfen.
- Experten-Review per Subagent abgebrochen (Rate-Limit) → Selbst-Review gemacht; Punkte: Legacy-Cache-Regex `static|runtime-v2.[0-6].x` könnte gleichnamige Caches anderer Apps auf benditot.github.io löschen (nur Neu-Laden, kein Datenverlust); SW cached Supabase-GETs (Tagebuchdaten im Runtime-Cache) → E6/P2 prüfen.
- iOS-PWA nach Update einmal vom Homescreen löschen + neu hinzufügen (start_url geändert).

## Nächste Schritte
1. Push v2.6.1 (Befehl unten), dann auf iPhone: Export JSON + Drucken + Statistiken testen.
2. Sprint weiter: **E2** (Archiv-Liste default + Race/Datum-Fix) + **E3** (Foto-Galerie) → v2.7.0.

```bash
cd "/Volumes/2tb/Codex playground/6min-tagebuch-github" && git add index.html sw.js manifest.json HANDOVER.md && git commit -m "v2.6.1: Export repariert, Cloud-Stats, PWA-Pfade unter /6min-tagebuch/" && git push origin main
```

## Einstiegs-Prompt neue Session
„Lies HANDOVER.md und SPRINT-CODEX-6MIN-E1-E6-2026-09-24.md im Ordner 6min-tagebuch-github. v2.6.1 ist live. Starte E2+E3 (v2.7.0), nur Supabase-Track."
