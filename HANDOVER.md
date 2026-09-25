# HANDOVER — 6-Minuten-Tagebuch (Live-Track Supabase)

**Stand:** 2026-09-25 · Arbeitsordner: `/Volumes/2tb/Codex playground/6min-tagebuch-github` (einzige Deploy-Quelle)
**Live:** https://benditot.github.io/6min-tagebuch/
**Plan:** `SPRINT-CODEX-6MIN-E1-E6-2026-09-24.md` · Befunde: `EXPERTEN-REVIEW-2026-09-24.md`

## Live: v2.6.1 (gepusht 24.09., Commit 70721f6)
E1 Export + E4 Stats/PWA-Pfade + Privacy-Text. Live verifiziert (Version, SW, Manifest).

## Live: v2.7.0 (gepusht 25.09., Commit 4553582)
Archiv-Liste als Default + Suche, Race/Datum-Fixes, iOS-Export-Sheet (Lesen/Kopieren/Drucken).

## Bereit zum Push: v2.7.1 — lokal, NICHT committet
Anlass: Norbert (25.09.): „Export funktioniert noch nicht" + Wunsch: in der Liste direkt zum vorigen/nächsten Eintrag.
- **Echte Ursache Export (per Supabase-Schema geprüft, keine Inhalte gelesen):** Code nutzte Tabelle `habit_logs`, in der DB heißt sie `habit_tracks` → Anfrage schlug fehl → gesamter Cloud-Export brach ab. Alle 8 Stellen auf `habit_tracks` umgestellt. Nebeneffekt behoben: Habit-Häkchen wurden in der Cloud nie gespeichert; „Alle Daten löschen" brach an dieser Stelle ab; Habit-Quote in Statistik.
- Export robust: nur `daily_entries` ist Pflicht; Nebentabellen-Fehler → Warnung im Export statt Totalausfall.
- **Blättern:** Detail aus der Liste mit „‹ Neuer | ☰ Liste | Älter ›" oben, unten nochmal; Wischen links/rechts; am Seitenende lädt „Älter" automatisch nach.
- Tests: 44/44 grün (u. a. Fake-DB wirft Fehler für nicht existierende Tabellen wie echtes PostgREST, Nebentabellen-Ausfall, kein Bucket, Pager, Wischen, Nachladen).

## Wichtiger Befund für E3 (Galerie) — Entscheidung Norbert nötig
- **Storage-Bucket `daily-photos` existiert NICHT** (storage.buckets leer). Cloud-Fotos landen bisher nur im localStorage des jeweiligen Geräts (Upload schlägt still fehl) → nicht geräteübergreifend, gehen beim Löschen der Website-Daten verloren.
- Vorschlag: privaten Bucket `daily-photos` anlegen + RLS-Policies „nur eigener Ordner `<user_id>/`" (select/insert/update/delete), CSP `img-src` um `https://*.supabase.co` erweitern; danach lokale Fotos einmalig hochladen (Migration). Erst nach deinem OK.

## Offen / Risiken
- Echtes iPhone: nach Push testen — Einstellungen → Version muss **2.7.0** zeigen (sonst App schließen/neu öffnen bzw. Update-Banner tippen). Dann: Export → „Alle Einträge lesen", „Drucken", „Teilen"; Archiv-Liste.
- Ob window.print() in der iOS-Homescreen-App den Druckdialog öffnet, ist ungetestet; „Lesen" + „Teilen" sind die sicheren Wege.
- `_to_delete/index.lock.stale` im Ordner kann gelöscht werden.
- SW cached Supabase-GETs (Tagebuchdaten im Runtime-Cache) → E6 prüfen. Legacy-Cache-Regex siehe v2.6.1-Notiz.

## Nächste Schritte
1. Push v2.7.1 (Befehl unten), iPhone-Test Export + Blättern.
2. **E3 Foto-Galerie** (Bucket anlegen nach OK, Grid, Monatsfilter, Lightbox prev/next, Löschen, Foto-Migration, CSP) → v2.8.0.
3. E5 Offline-Queue/Migration/Freeze, dann E6.

```bash
cd "/Volumes/2tb/Codex playground/6min-tagebuch-github" && git add index.html sw.js HANDOVER.md && git commit -m "v2.7.1: Export-Fix (habit_tracks), Vor/Zurück im Archiv" && git push origin main
```

## Einstiegs-Prompt neue Session
„Lies HANDOVER.md und SPRINT-CODEX-6MIN-E1-E6-2026-09-24.md im Ordner 6min-tagebuch-github. v2.7.1 ist live. Starte E3 Foto-Galerie (v2.8.0) — zuerst Bucket-Entscheidung klären, nur Supabase-Track."
