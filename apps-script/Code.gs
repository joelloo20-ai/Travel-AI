/**
 * Travel Capture — Trip Router + Web App API
 *
 * Two ways data gets into this spreadsheet, both landing in the same
 * per-trip tab (e.g. "Melbourne Oct 2026"):
 *   1. onFormSubmit(e)  — installable trigger, fires when the Google Form
 *      ("Travel Capture | Jaybee Travels") is submitted.
 *   2. doPost(e)        — Web App endpoint. The Wayfare (Travel-AI) website
 *      POSTs here directly from the browser to sync an expense or a full
 *      itinerary for a trip.
 *
 * Deploy doPost as a Web App (Deploy > New deployment > Web app,
 * execute as Me, access: Anyone) after editing SHARED_SECRET below.
 */

const SPREADSHEET_ID = '15GhVX45KoMt9fjeMoMdjYnEe6qT6eT59vgHmDchk0R8';
const FORM_ID = '1TaGE_jVlzRvZlTjkeQpJa-STx9DU4inqQDcw9kJsVnw';
const MASTER_SHEET_NAME = 'Form Responses 1';
const TRIP_QUESTION_HEADER = 'Which trip is this for?';
const AMOUNT_HEADER = 'Amount (SGD)';
const SOURCE_HEADER = 'Source';

// Must match the Travel-AI app's VITE_APPS_SCRIPT_SHARED_SECRET build setting
// (see .env.example / the GitHub Actions repo secret). It's a light deterrent,
// not real security — this is a static site, so anyone who opens dev tools on
// the live site can see this value and the Web App URL. Rotate it here and in
// the app's secret if that ever matters to you.
const SHARED_SECRET = 'EnOlWPzXJtfwUEL4cDnRHhEDff2gLfz_';

// ---------------------------------------------------------------------
// Form trigger (unchanged behavior, now writes through the shared helper)
// ---------------------------------------------------------------------

function onFormSubmit(e) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const masterSheet = ss.getSheetByName(MASTER_SHEET_NAME);
  const lastCol = masterSheet.getLastColumn();
  const masterHeaders = masterSheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const lastRow = masterSheet.getLastRow();
  const row = masterSheet.getRange(lastRow, 1, 1, lastCol).getValues()[0];

  const tripColIndex = masterHeaders.indexOf(TRIP_QUESTION_HEADER);
  let tripName = (tripColIndex > -1 && row[tripColIndex]) ? row[tripColIndex].toString().trim() : '';
  if (!tripName) tripName = 'Unsorted';

  const tripSheet = getOrCreateTripSheet(ss, tripName, masterHeaders);
  tripSheet.appendRow(row.concat(['Form']));
}

function setupTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function (t) {
    if (t.getHandlerFunction() === 'onFormSubmit') {
      ScriptApp.deleteTrigger(t);
    }
  });
  ScriptApp.newTrigger('onFormSubmit')
    .forSpreadsheet(SPREADSHEET_ID)
    .onFormSubmit()
    .create();
}

// ---------------------------------------------------------------------
// Web App API — called directly from the Travel-AI website's browser JS
// ---------------------------------------------------------------------

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.secret !== SHARED_SECRET) {
      return jsonResponse({ ok: false, error: 'Bad secret' });
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    if (body.type === 'expense') {
      return jsonResponse(handleExpense(ss, body));
    }
    if (body.type === 'itinerary') {
      return jsonResponse(handleItinerary(ss, body));
    }
    return jsonResponse({ ok: false, error: 'Unknown type: ' + body.type });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

function doGet() {
  return jsonResponse({ ok: true, message: 'Travel Capture API is running. POST JSON to this URL.' });
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function getMasterHeaders(ss) {
  const masterSheet = ss.getSheetByName(MASTER_SHEET_NAME);
  const lastCol = masterSheet.getLastColumn();
  return masterSheet.getRange(1, 1, 1, lastCol).getValues()[0];
}

/**
 * Maps the app's own expense-category vocabulary onto the Form's
 * Category dropdown options, so both sources read the same in the sheet.
 */
const APP_CATEGORY_MAP = {
  flights: 'Transport',
  lodging: 'Accommodation',
  food: 'Food & Drink',
  activities: 'Activities/Sightseeing',
  transport: 'Transport',
  shopping: 'Shopping',
  other: 'Other',
};

function handleExpense(ss, body) {
  const tripName = (body.trip || 'Unsorted').toString().trim() || 'Unsorted';
  const masterHeaders = getMasterHeaders(ss);
  const tripSheet = getOrCreateTripSheet(ss, tripName, masterHeaders);

  const category = APP_CATEGORY_MAP[body.category] || body.category || 'Other';
  let label = body.label || '';
  const currency = (body.currency || 'SGD').toUpperCase();
  let note = body.note || '';
  if (currency !== 'SGD') {
    note = (note ? note + ' ' : '') + '(originally ' + body.amount + ' ' + currency + ')';
  }

  // Row order must match masterHeaders exactly:
  // Timestamp, Which trip is this for?, Receipt photo (optional),
  // Where did you actually go or what happened?, How was it?, Category, Amount (SGD)
  const row = [
    body.date || new Date().toISOString(),
    tripName,
    '',
    note ? label + ' — ' + note : label,
    '',
    category,
    body.amount,
    'App',
  ];
  tripSheet.appendRow(row);
  return { ok: true, formSync: ensureTripInFormOptions(tripName) };
}

function handleItinerary(ss, body) {
  const tripName = (body.trip || body.destination || 'Unsorted').toString().trim() || 'Unsorted';
  const masterHeaders = getMasterHeaders(ss);
  const tripSheet = getOrCreateTripSheet(ss, tripName, masterHeaders);

  // Layout per trip tab: A.. = expense columns (masterHeaders + Source), then one
  // spacer, then Total label + Total value, then one more spacer, then this block.
  const expenseCols = masterHeaders.length + 1; // + Source column
  const startCol = expenseCols + 1 /* spacer */ + 2 /* total label + value */ + 1 /* spacer */ + 1;
  // Clear a generous area first so re-planning overwrites cleanly instead of leaving stale rows.
  const CLEAR_ROWS = 500;
  const CLEAR_COLS = 8;
  tripSheet.getRange(1, startCol, CLEAR_ROWS, CLEAR_COLS).clear();

  const c = startCol;
  tripSheet.getRange(1, c, 1, CLEAR_COLS).merge().setValue('Trip Details')
    .setFontWeight('bold').setBackground('#673ab7').setFontColor('#ffffff');

  const details = [
    ['Destination', body.destination || tripName],
    ['Dates', formatDateRange(body.startDate, body.endDate)],
    ['Travelers', body.travelers || ''],
    ['Budget (SGD)', body.budget || ''],
    ['Pace', body.pace || ''],
    ['Planned via', body.source || ''],
  ];
  tripSheet.getRange(2, c, details.length, 2).setValues(details);
  tripSheet.getRange(2, c, details.length, 1).setFontWeight('bold');

  const itinHeaderRow = details.length + 3;
  tripSheet.getRange(itinHeaderRow - 1, c, 1, CLEAR_COLS).merge().setValue('Itinerary')
    .setFontWeight('bold').setBackground('#673ab7').setFontColor('#ffffff');
  const columns = ['Day', 'Date', 'Time', 'Activity', 'Description', 'Category', 'Location', 'Est. Cost (SGD)'];
  tripSheet.getRange(itinHeaderRow, c, 1, columns.length).setValues([columns]).setFontWeight('bold');

  const rows = [];
  (body.days || []).forEach(function (day) {
    (day.activities || []).forEach(function (act) {
      rows.push([
        day.dayNumber,
        day.date || '',
        act.time || '',
        act.title || '',
        act.description || '',
        act.category || '',
        act.location || '',
        act.estCost || 0,
      ]);
    });
  });
  if (rows.length > 0) {
    tripSheet.getRange(itinHeaderRow + 1, c, rows.length, columns.length).setValues(rows);
  }
  tripSheet.autoResizeColumns(c, columns.length);

  return { ok: true, rows: rows.length, formSync: ensureTripInFormOptions(tripName) };
}

function formatDateRange(start, end) {
  if (!start) return 'Not set';
  return end && end !== start ? start + ' to ' + end : start;
}

/** Creates the trip's tab (masterHeaders + Source column) if it doesn't exist yet. */
function getOrCreateTripSheet(ss, tripName, masterHeaders) {
  const safeName = tripName.replace(/[\[\]\*\?\/\\:]/g, '-').substring(0, 100);
  let tripSheet = ss.getSheetByName(safeName);
  if (!tripSheet) {
    tripSheet = ss.insertSheet(safeName);
  }

  if (tripSheet.getLastRow() === 0) {
    const tripHeaders = masterHeaders.concat([SOURCE_HEADER]);
    tripSheet.getRange(1, 1, 1, tripHeaders.length).setValues([tripHeaders]);
    tripSheet.getRange(1, 1, 1, tripHeaders.length).setFontWeight('bold').setBackground('#673ab7').setFontColor('#ffffff');
    tripSheet.setFrozenRows(1);

    const amountColIndex = masterHeaders.indexOf(AMOUNT_HEADER);
    if (amountColIndex > -1) {
      const totalLabelCol = tripHeaders.length + 2;
      const totalValueCol = tripHeaders.length + 3;
      tripSheet.getRange(1, totalLabelCol).setValue('Total spent (SGD):').setFontWeight('bold');
      const colLetter = columnToLetter(amountColIndex + 1);
      tripSheet.getRange(1, totalValueCol).setFormula('=SUM(' + colLetter + '2:' + colLetter + ')')
        .setFontWeight('bold').setNumberFormat('#,##0.00');
    }
  }
  return tripSheet;
}

/**
 * Adds tripName as a new choice on the Form's trip question if it isn't already one.
 * Matches the question by normalized title (whitespace/case-insensitive) and handles
 * both radio-button and dropdown questions. Returns a short status string, which the
 * API echoes back as `formSync` — a silent failure here is otherwise invisible, since
 * this is deliberately non-fatal (the trip tab gets written either way).
 */
function ensureTripInFormOptions(tripName) {
  try {
    const form = FormApp.openById(FORM_ID);
    const wanted = normalizeTitle(TRIP_QUESTION_HEADER);
    const items = form.getItems();
    const seenTitles = [];
    for (let i = 0; i < items.length; i++) {
      const type = items[i].getType();
      if (type !== FormApp.ItemType.MULTIPLE_CHOICE && type !== FormApp.ItemType.LIST) continue;
      const item = type === FormApp.ItemType.LIST ? items[i].asListItem() : items[i].asMultipleChoiceItem();
      seenTitles.push(item.getTitle());
      if (normalizeTitle(item.getTitle()) !== wanted) continue;

      const choices = item.getChoices();
      const existing = choices.filter(function (ch) { return !ch.isOther(); }).map(function (ch) { return ch.getValue(); });
      if (existing.indexOf(tripName) > -1) return 'already present';
      const hasOther = choices.some(function (ch) { return ch.isOther(); });
      item.setChoiceValues(existing.concat([tripName]));
      if (type === FormApp.ItemType.MULTIPLE_CHOICE) item.showOtherOption(hasOther);
      return 'added';
    }
    return 'no matching question (saw: ' + seenTitles.join(' | ') + ')';
  } catch (err) {
    return 'error: ' + err;
  }
}

function normalizeTitle(s) {
  return String(s).replace(/\s+/g, ' ').trim().toLowerCase();
}

function columnToLetter(column) {
  let temp = 0;
  let letter = '';
  while (column > 0) {
    temp = (column - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    column = (column - temp - 1) / 26;
  }
  return letter;
}
