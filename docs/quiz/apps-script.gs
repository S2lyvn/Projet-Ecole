// DeepIN Armour — réception des réponses du quiz de présentation.
// À coller dans le Google Sheet : Extensions › Apps Script (remplacer tout le contenu), puis déployer en « Application Web ».
// Mode d'emploi complet : docs/quiz/README.md
//
// doPost : le quiz envoie une ligne par personne (identifiée par « id »). Plusieurs envois pour la même personne
//          (début, fin, intérêt) mettent à jour la même ligne : pas de doublon.
// doGet  : renvoie les statistiques pour la page de résultats en direct (aucune donnée individuelle).

// Identifiant du Google Sheet (dans son adresse : /spreadsheets/d/<ID>/edit). Vide = le Sheet d'où le script a été ouvert.
var SPREADSHEET_ID = ''
var SHEET_NAME = 'Réponses'
var COLUMNS = [
  'id', 'maj', 'source', 'etape',
  'taille', 'part_portee', 'raisons', 'valeur',
  'achats_neufs', 'echanges_prets', 'reparations', 'dons',
  'score', 'pct_dormant', 'pieces_dormantes', 'interet',
  // Ajouté le 13/11/2026 : toujours ajouter les nouvelles colonnes à la fin.
  'communaute',
]
var MAX_LEN = 300 // longueur maximale d'une valeur texte

function doPost(e) {
  var data
  try {
    data = JSON.parse(e.postData.contents)
  } catch (err) {
    return text_('json invalide')
  }
  if (!data || typeof data !== 'object' || !data.id) return text_('id manquant')
  var id = clean_(data.id)

  var lock = LockService.getScriptLock()
  lock.waitLock(25000)
  try {
    var sheet = sheet_()
    var found = sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 1), 1)
      .createTextFinder(id).matchEntireCell(true).findNext()
    if (found) {
      var range = sheet.getRange(found.getRow(), 1, 1, COLUMNS.length)
      var current = range.getValues()[0]
      range.setValues([COLUMNS.map(function (c, i) {
        if (c === 'maj') return new Date()
        return data[c] === undefined || data[c] === null ? current[i] : clean_(data[c])
      })])
    } else {
      sheet.appendRow(COLUMNS.map(function (c) {
        if (c === 'maj') return new Date()
        return data[c] === undefined || data[c] === null ? '' : clean_(data[c])
      }))
    }
  } finally {
    lock.releaseLock()
  }
  return text_('ok')
}

function doGet(e) {
  var params = (e && e.parameter) || {}
  var sheet = sheet_()
  var values = sheet.getLastRow() > 1
    ? sheet.getRange(2, 1, sheet.getLastRow() - 1, COLUMNS.length).getValues()
    : []
  var rows = values.map(function (v) {
    var o = {}
    COLUMNS.forEach(function (c, i) { o[c] = v[i] })
    return o
  })
  var out = stats_(rows, clean_(params.source || ''))
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON)
}

/** Statistiques agrégées. Fonction pure (testable hors de Google). */
function stats_(rows, source) {
  var sources = {}
  rows.forEach(function (r) { var s = r.source || 'direct'; sources[s] = (sources[s] || 0) + 1 })
  if (source) rows = rows.filter(function (r) { return (r.source || 'direct') === source })

  var done = rows.filter(function (r) { return r.etape === 'termine' || r.etape === 'interet' })
  function count(key, multi) {
    var c = {}
    done.forEach(function (r) {
      var v = String(r[key] || '')
      if (!v) return
      ;(multi ? v.split(' ; ') : [v]).forEach(function (x) { c[x] = (c[x] || 0) + 1 })
    })
    return c
  }
  function avg(key) {
    var nums = done
      .filter(function (r) { return r[key] !== '' && r[key] !== null && r[key] !== undefined })
      .map(function (r) { return Number(r[key]) })
      .filter(function (n) { return !isNaN(n) })
    if (!nums.length) return null
    return Math.round(nums.reduce(function (a, b) { return a + b }, 0) / nums.length * 10) / 10
  }
  return {
    ok: true,
    updated: new Date().toISOString(),
    source: source || null,
    sources: sources,
    started: rows.length,
    completed: done.length,
    avgScore: avg('score'),
    avgPctDormant: avg('pct_dormant'),
    questions: {
      taille: count('taille'),
      part_portee: count('part_portee'),
      raisons: count('raisons', true),
      communaute: count('communaute', true),
      valeur: count('valeur'),
      interet: count('interet'),
    },
    habits: {
      achats_neufs: avg('achats_neufs'),
      echanges_prets: avg('echanges_prets'),
      reparations: avg('reparations'),
      dons: avg('dons'),
    },
  }
}

function sheet_() {
  var ss = SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet()
  var sheet = ss.getSheetByName(SHEET_NAME)
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME)
    sheet.appendRow(COLUMNS)
    sheet.setFrozenRows(1)
    sheet.getRange(1, 1, 1, COLUMNS.length).setFontWeight('bold')
  } else if (sheet.getLastColumn() < COLUMNS.length) {
    // Nouvelle colonne ajoutée au script : on complète l'en-tête.
    sheet.getRange(1, 1, 1, COLUMNS.length).setValues([COLUMNS]).setFontWeight('bold')
  }
  return sheet
}

function clean_(v) {
  if (typeof v === 'number') return v
  var s = String(v).slice(0, MAX_LEN)
  // Empêche une valeur d'être lue comme une formule par Google Sheets.
  return /^[=+\-@]/.test(s) ? "'" + s : s
}

function text_(s) {
  return ContentService.createTextOutput(s)
}
