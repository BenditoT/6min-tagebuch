# HANDOVER — 6-Minuten-Tagebuch (Live-Track Supabase)

**Stand:** 2026-09-25 · Arbeitsordner: `/Volumes/2tb/Codex playground/6min-tagebuch-github` (einzige Deploy-Quelle)
**Live:** https://benditot.github.io/6min-tagebuch/
**Plan:** `SPRINT-CODEX-6MIN-E1-E6-2026-09-24.md` · Befunde: `EXPERTEN-REVIEW-2026-09-24.md`

## Live: v2.6.1 (gepusht 24.09., Commit 70721f6)
E1 Export + E4 Stats/PWA-Pfade + Privacy-Text. Live verifiziert (Version, SW, Manifest).

## Bereit zum Push: v2.7.0 = E2 + Export-iOS-Fix — lokal, NICHT committet
Anlass: Norbert (25.09.): „Export funktioniert noch nicht" + „alte Einträge als Liste lesen".
- Export live-getestet (Desktop lädt, iPhone-Emulation zeigt Sheet) → vermutete Ursache echtes iPhone: Share/Blob-Link/iframe-Druck in der Homescreen-App.
  Fix: Sheet mit „📖 Alle Einträge lesen" (In-App-Leseansicht, klappt immer), „📋 JSON kopieren", Drucken über window.print im selben Dokument (App per @media print ausgeblendet, kein iframe/Popup). Blob-Link entfernt.
- **E2 Archiv:** Default = chronologische Liste (neueste zuerst, Heute/Gestern, 🌅🌙📸, Vorschau), Suche v1 (filtert geladene Einträge, Hinweis mit Trefferzahl), „Ältere Einträge laden" (30er-Seiten), Toggle Liste|Kalender. Tap → bestehende Detailansicht mit „← Zur Liste".
- Race-Fix: Request-IDs + Loading-Flag modulweit; Monats-Dots mit Guard. Datum: `getEntries` reicht YYYY-MM-DD durch (kein UTC-Versatz), `toLocalDateStr`.
- Nebenbei: doppeltes Escaping im Archiv-Detail entfernt (& wurde als &amp; angezeigt); Tab „Einstellungen"; Archiv lädt beim Öffnen frisch.
- Tests (Playwright, synthetisch, Fake-Supabase): 38/38 grün inkl. Liste, Paginierung 40 Tage, Suche, Race (langsamer Request), Zeitzone Honolulu, iOS-Leseansicht.

## Offen / Risiken
- Echtes iPhone: nach Push testen — Einstellungen → Version muss **2.7.0** zeigen (sonst App schließen/neu öffnen bzw. Update-Banner tippen). Dann: Export → „Alle Einträge lesen", „Drucken", „Teilen"; Archiv-Liste.
- Ob window.print() in der iOS-Homescreen-App den Druckdialog öffnet, ist ungetestet; „Lesen" + „Teilen" sind die sicheren Wege.
- `_to_delete/index.lock.stale` im Ordner kann gelöscht werden.
- SW cached Supabase-GETs (Tagebuchdaten im Runtime-Cache) → E6 prüfen. Legacy-Cache-Regex siehe v2.6.1-Notiz.

## Nächste Schritte
1. Push v2.7.0 (Befehl unten), iPhone-Test.
2. **E3 Foto-Galerie** (Grid, Monatsfilter, Lightbox prev/next, Löschen, weg von Base64-localStorage, CSP) → v2.7.1.
3. E5 Offline-Queue/Migration/Freeze, dann E6.

```bash
cd "/Volumes/2tb/Codex playground/6min-tagebuch-github" && git add index.html sw.js HANDOVER.md && git commit -m "v2.7.0: Archiv-Liste als Default + Suche, Race/Datum-Fixes, iOS-fester Export" && git push origin main
```

## Einstiegs-Prompt neue Session
„Lies HANDOVER.md und SPRINT-CODEX-6MIN-E1-E6-2026-09-24.md im Ordner 6min-tagebuch-github. v2.7.0 ist live. Starte E3 Foto-Galerie (v2.7.1), nur Supabase-Track."
