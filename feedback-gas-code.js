// ============================================================================
// Google Apps Script: Feedback-Endpoint für 6-Minuten-Tagebuch
// ============================================================================
//
// ANLEITUNG:
// 1. Neues Google Sheet erstellen (z.B. "6min-Tagebuch-Feedback")
// 2. Menü: Erweiterungen → Apps Script
// 3. Diesen Code einfügen (alten Code.gs ersetzen)
// 4. Speichern
// 5. Deploy → Neue Bereitstellung → Web-App
//    - Ausführen als: Ich
//    - Zugriff: Jeder
// 6. URL kopieren und in index.html bei FEEDBACK_GAS_URL eintragen
//
// ============================================================================

const ALLOWED_CATEGORIES = ['Fehler', 'Verbesserung', 'Lob', 'Frage', 'Sonstiges'];
const MAX_ROWS = 1000;
const FEEDBACK_SHEET_NAME = 'Feedback';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // Validate category
    if (!ALLOWED_CATEGORIES.includes(data.category)) {
      return ContentService.createTextOutput(
        JSON.stringify({ error: 'Invalid category' })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Validate rating
    if (data.rating && (data.rating < 0 || data.rating > 5)) {
      return ContentService.createTextOutput(
        JSON.stringify({ error: 'Rating must be 0-5' })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Validate string lengths
    if ((data.name || '').length > 100 || (data.message || '').length > 2000 ||
        (data.page || '').length > 200 || (data.userAgent || '').length > 300) {
      return ContentService.createTextOutput(
        JSON.stringify({ error: 'Input exceeds maximum length' })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    const sheet = getOrCreateFeedbackSheet();

    // Anti-spam: check row limit
    if (sheet.getLastRow() >= MAX_ROWS) {
      return ContentService.createTextOutput(
        JSON.stringify({ error: 'Feedback collection paused' })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Write feedback row
    sheet.appendRow([
      new Date(),
      data.name || 'Anonym',
      data.category,
      data.rating || 0,
      data.message,
      data.page,
      data.userAgent
    ]);

    return ContentService.createTextOutput(
      JSON.stringify({ success: true })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateFeedbackSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(FEEDBACK_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(FEEDBACK_SHEET_NAME);
    setupFeedbackSheet(sheet);
  }

  return sheet;
}

function setupFeedbackSheet(sheet) {
  const headers = ['Zeitstempel', 'Name', 'Kategorie', 'Bewertung', 'Nachricht', 'Seite', 'User-Agent'];
  sheet.appendRow(headers);

  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#E8B86D');
  headerRange.setFontColor('#1A1A2E');
  headerRange.setFontWeight('bold');

  sheet.setColumnWidth(1, 160);  // Zeitstempel
  sheet.setColumnWidth(2, 120);  // Name
  sheet.setColumnWidth(3, 120);  // Kategorie
  sheet.setColumnWidth(4, 80);   // Bewertung
  sheet.setColumnWidth(5, 400);  // Nachricht
  sheet.setColumnWidth(6, 100);  // Seite
  sheet.setColumnWidth(7, 200);  // User-Agent
}
