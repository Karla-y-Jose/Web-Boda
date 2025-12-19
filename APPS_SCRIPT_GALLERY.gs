// ========== CONFIGURACIÓN ==========
const DRIVE_FOLDER_ID = '1hKX5k9xZfphAo2FzdvB2osMWbRimOZxo';  // ID de la carpeta de Google Drive
const GALLERY_SPREADSHEET_ID = '1YZbX8HIpzAttLVtE2CUTBi5tMgbD98RhXMhq-F7T5sk';  // ID del Google Sheet
const SHEET_NAME = 'Galeria';  // Nombre de la hoja en el Sheet

// Email para notificaciones
const EMAIL_NOTIFICACION = 'karla.y.jose.18.12.26@gmail.com';

// RSVP sheet (source of truth for CODIGO_GRUPO)
const RSVP_SPREADSHEET_ID = '1tFt-UjwaQS80uM1ECrMxnLJGU-MWO9lWnxZyPnYV530';
const RSVP_SHEET_NAME = 'RSVP-Boda-KarlaJose';

// ========== SEGURIDAD / VALIDACIÓN ==========
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
];
const MAX_GUEST_NAME_LENGTH = 80;
const MAX_FILE_NAME_LENGTH = 120;

const SHEET_HEADERS = [
  'Timestamp',
  'Nombre_Invitado',
  'URL_Foto',
  'File_ID',
  'Seccion',
  'Nombre_Archivo',
  'Aprobada'
];

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function sanitizeSheetValue(value) {
  const str = String(value || '').trim();
  // Previene "formula injection" en Sheets
  if (/^[=+\-@]/.test(str)) return `'${str}`;
  return str;
}

function sanitizeGuestName(name) {
  const cleaned = sanitizeSheetValue(name).replace(/\s+/g, ' ').trim();
  return cleaned.slice(0, MAX_GUEST_NAME_LENGTH);
}

function sanitizeFileName(name) {
  const raw = String(name || '').trim();
  const base = raw
    .replace(/[/\\]/g, '-')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const limited = base.slice(0, MAX_FILE_NAME_LENGTH);
  return limited || 'foto';
}

function normalizeSection(section) {
  const s = String(section || '').toLowerCase().trim();
  const allowed = ['pedida', 'savethedate', 'boda', 'invitados', 'all'];
  return allowed.includes(s) ? s : 'invitados';
}

function normalizeGroupCode(code) {
  return String(code || '').trim().toUpperCase().replace(/[\s-]+/g, '');
}

function findGroupCodeColumn(headers) {
  const candidates = ['GROUP_CODE', 'CODIGO_GRUPO', 'ID_CODIGO_GRUPO', 'ACCESS_CODE', 'CLAVE_GRUPO', 'CODIGO'];
  for (let i = 0; i < candidates.length; i++) {
    const idx = headers.indexOf(candidates[i]);
    if (idx !== -1) return idx;
  }
  return -1;
}

function isValidRsvpGroupCode(groupCode) {
  const code = normalizeGroupCode(groupCode);
  if (!code) return false;

  const cache = CacheService.getScriptCache();
  const cached = cache.get('rsvp_group_code_' + code);
  if (cached === '1') return true;
  if (cached === '0') return false;

  const ss = SpreadsheetApp.openById(RSVP_SPREADSHEET_ID);
  const sheet = ss.getSheetByName(RSVP_SHEET_NAME);
  if (!sheet) return false;
  const values = sheet.getDataRange().getValues();
  if (!values || values.length < 2) return false;
  const headers = values[0].map(String);
  const col = findGroupCodeColumn(headers);
  if (col === -1) return false;

  for (let i = 1; i < values.length; i++) {
    const rowCode = normalizeGroupCode(values[i][col]);
    if (rowCode && rowCode === code) {
      cache.put('rsvp_group_code_' + code, '1', 3600);
      return true;
    }
  }

  cache.put('rsvp_group_code_' + code, '0', 600);
  return false;
}

function requireValidGroupCodeOrThrow(groupCode) {
  if (!isValidRsvpGroupCode(groupCode)) {
    throw new Error('Código de grupo inválido');
  }
}

function parsePostParams(e) {
  // Support both JSON and form-encoded.
  if (e && e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (_err) {
      return e.parameter || {};
    }
  }
  return (e && e.parameter) ? e.parameter : {};
}

function parseDataUri(dataUri) {
  if (!dataUri || typeof dataUri !== 'string') {
    throw new Error('photoData inválido');
  }

  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error('photoData debe ser un Data URI base64');
  }
  return { contentType: match[1].toLowerCase(), base64: match[2] };
}

function isAllowedImageBytes(bytes, contentType) {
  // Valida magic bytes para evitar contenido no-imagen con MIME falso
  // Nota: en Apps Script los bytes pueden venir como signed byte (-128..127).
  // Normalizamos a 0..255 para comparar correctamente.
  const u8 = (idx) => (bytes[idx] & 0xFF);
  // JPEG: FF D8 FF
  if (contentType === 'image/jpeg') {
    return bytes.length >= 3 && u8(0) === 0xFF && u8(1) === 0xD8 && u8(2) === 0xFF;
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (contentType === 'image/png') {
    return bytes.length >= 8 &&
      u8(0) === 0x89 && u8(1) === 0x50 && u8(2) === 0x4E && u8(3) === 0x47 &&
      u8(4) === 0x0D && u8(5) === 0x0A && u8(6) === 0x1A && u8(7) === 0x0A;
  }
  // GIF: GIF87a / GIF89a
  if (contentType === 'image/gif') {
    return bytes.length >= 6 &&
      u8(0) === 0x47 && u8(1) === 0x49 && u8(2) === 0x46 && u8(3) === 0x38 &&
      (u8(4) === 0x37 || u8(4) === 0x39) && u8(5) === 0x61;
  }
  // WEBP: RIFF .... WEBP
  if (contentType === 'image/webp') {
    return bytes.length >= 12 &&
      u8(0) === 0x52 && u8(1) === 0x49 && u8(2) === 0x46 && u8(3) === 0x46 &&
      u8(8) === 0x57 && u8(9) === 0x45 && u8(10) === 0x42 && u8(11) === 0x50;
  }
  return false;
}

function ensureSheetAndHeaders() {
  const ss = SpreadsheetApp.openById(GALLERY_SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(SHEET_HEADERS);
    return sheet;
  }

  const lastCol = sheet.getLastColumn();
  if (lastCol === 0) {
    sheet.appendRow(SHEET_HEADERS);
    return sheet;
  }

  const existingHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
  let addedApproved = false;

  SHEET_HEADERS.forEach((h) => {
    if (existingHeaders.indexOf(h) === -1) {
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue(h);
      if (h === 'Aprobada') addedApproved = true;
    }
  });

  // Mantener compatibilidad: si agregamos Aprobada hoy, aprobamos lo existente.
  if (addedApproved) {
    const rows = sheet.getLastRow();
    const approvedCol = sheet.getLastColumn();
    if (rows > 1) {
      sheet.getRange(2, approvedCol, rows - 1, 1).setValue(true);
    }
  }

  return sheet;
}

/**
 * Función principal para manejar peticiones POST (subida de fotos)
 */
function doPost(e) {
  try {
    const data = parsePostParams(e);
    const action = data.action;
    
    if (action === 'uploadPhoto') {
      return uploadPhoto(data);
    }
    
    return jsonResponse({
      success: false,
      message: 'Acción no válida'
    });
    
  } catch (error) {
    Logger.log('Error en doPost: ' + error);
    return jsonResponse({
      success: false,
      message: 'Error: ' + error.toString()
    });
  }
}

/**
 * Función principal para manejar peticiones GET (obtener fotos)
 */
function doGet(e) {
  try {
    const params = e.parameter;
    const action = params.action;
    
    if (action === 'getPhotos') {
      const section = params.section || 'all';
      return getPhotos(section, params.groupCode);
    }

    if (action === 'getPhoto') {
      return getPhoto(params.fileId, params.groupCode);
    }
    
    return ContentService.createTextOutput('Gallery API funcionando correctamente');
    
  } catch (error) {
    Logger.log('Error en doGet: ' + error);
    return jsonResponse({
      success: false,
      message: 'Error: ' + error.toString()
    });
  }
}

/**
 * Subir foto a Google Drive y registrar en Sheets
 */
function uploadPhoto(data) {
  try {
    const guestName = sanitizeGuestName(data.guestName);
    const groupCode = normalizeGroupCode(data.groupCode);
    const photoData = data.photoData; // Data URI base64
    const fileName = sanitizeFileName(data.fileName);
    const section = normalizeSection(data.section || 'invitados'); // pedida, savethedate, boda, invitados

    requireValidGroupCodeOrThrow(groupCode);
    
    if (!guestName || !photoData || !fileName) {
      return jsonResponse({
        success: false,
        message: 'Faltan datos requeridos'
      });
    }

    const parsed = parseDataUri(photoData);
    const contentType = parsed.contentType;

    // Bloqueo explícito de SVG (vector; riesgo de contenido activo)
    if (contentType === 'image/svg+xml') {
      return jsonResponse({
        success: false,
        message: 'Formato no permitido (SVG)'
      });
    }

    if (ALLOWED_CONTENT_TYPES.indexOf(contentType) === -1) {
      return jsonResponse({
        success: false,
        message: 'Formato no permitido. Usa JPG, PNG, WEBP o GIF.'
      });
    }
    
    // Obtener carpeta de Google Drive
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    
    // Decodificar base64
    const bytes = Utilities.base64Decode(parsed.base64);
    if (!bytes || bytes.length === 0) {
      return jsonResponse({
        success: false,
        message: 'La imagen está vacía'
      });
    }
    if (bytes.length > MAX_IMAGE_BYTES) {
      return jsonResponse({
        success: false,
        message: 'La imagen excede el tamaño máximo (5MB)'
      });
    }
    if (!isAllowedImageBytes(bytes, contentType)) {
      return jsonResponse({
        success: false,
        message: 'El archivo no parece ser una imagen válida'
      });
    }

    const blob = Utilities.newBlob(bytes, contentType, fileName);
    
    // Subir archivo a Drive
    const file = folder.createFile(blob);

    const fileId = file.getId();
    // Keep the file private (folder is private). Images are served via Apps Script (getPhoto).
    const publicUrl = '';
    
    // Registrar en Google Sheets
    const sheetToUse = ensureSheetAndHeaders();
    const timestamp = new Date();
    const aprobada = false;
    
    sheetToUse.appendRow([
      timestamp,
      sanitizeSheetValue(guestName),
      publicUrl,
      fileId,
      section,
      sanitizeSheetValue(fileName),
      aprobada
    ]);
    
    // Enviar email de notificación (opcional)
    try {
      MailApp.sendEmail({
        to: EMAIL_NOTIFICACION,
        subject: '📸 Nueva foto subida - Boda Karla & Jose',
        body: `
          ¡Hola! Se ha subido una nueva foto a la galería.
          
          👤 Invitado: ${guestName}
          📁 Sección: ${section}
          📷 Archivo: ${fileName}
          🕐 Fecha: ${timestamp}

          Moderación: esta foto queda PENDIENTE hasta aprobarla en el Google Sheet (${SHEET_NAME}) marcando la columna "Aprobada".
          
          ¡Saludos!
        `
      });
    } catch (emailError) {
      Logger.log('Error enviando email: ' + emailError);
      // No fallar si el email falla
    }
    
    return jsonResponse({
      success: true,
      message: 'Foto subida exitosamente (pendiente de aprobación)',
      photo: {
        url: '',
        fileId: fileId,
        guestName: guestName,
        timestamp: timestamp,
        section: section,
        approved: false
      }
    });
    
  } catch (error) {
    Logger.log('Error en uploadPhoto: ' + error);
    return jsonResponse({
      success: false,
      message: 'Error al subir foto: ' + error.toString()
    });
  }
}

/**
 * Obtener todas las fotos o filtradas por sección
 */
function getPhotos(section, groupCode) {
  try {
    requireValidGroupCodeOrThrow(groupCode);
    const sheet = ensureSheetAndHeaders();
    
    if (!sheet) {
      return jsonResponse({
        success: true,
        photos: []
      });
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const photos = [];
    
    // Índices de columnas
    const timestampCol = headers.indexOf('Timestamp');
    const nombreCol = headers.indexOf('Nombre_Invitado');
    const urlCol = headers.indexOf('URL_Foto');
    const fileIdCol = headers.indexOf('File_ID');
    const seccionCol = headers.indexOf('Seccion');
    const archivoCol = headers.indexOf('Nombre_Archivo');
    const aprobadaCol = headers.indexOf('Aprobada');
    
    // Recorrer filas (saltando header)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const photoSection = row[seccionCol] || 'invitados';

      // Solo mostrar aprobadas
      const approved = aprobadaCol === -1 ? true : Boolean(row[aprobadaCol]);
      if (!approved) {
        continue;
      }
      
      // Filtrar por sección si se especifica
      if (section !== 'all' && photoSection !== section) {
        continue;
      }
      
      photos.push({
        timestamp: row[timestampCol],
        guestName: row[nombreCol],
        fileId: row[fileIdCol],
        section: photoSection,
        fileName: row[archivoCol]
      });
    }
    
    // Ordenar por timestamp descendente (más recientes primero)
    photos.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return jsonResponse({
      success: true,
      photos: photos,
      total: photos.length
    });
    
  } catch (error) {
    Logger.log('Error en getPhotos: ' + error);
    return jsonResponse({
      success: false,
      message: 'Error al obtener fotos: ' + error.toString()
    });
  }
}

function getPhoto(fileId, groupCode) {
  try {
    requireValidGroupCodeOrThrow(groupCode);
    const id = String(fileId || '').trim();
    if (!id) {
      return jsonResponse({ success: false, message: 'fileId requerido' });
    }

    const file = DriveApp.getFileById(id);
    const blob = file.getBlob();
    const contentType = String(blob.getContentType() || '').toLowerCase();
    if (ALLOWED_CONTENT_TYPES.indexOf(contentType) === -1) {
      return jsonResponse({ success: false, message: 'Tipo de archivo no permitido' });
    }
    const bytes = blob.getBytes();
    if (!bytes || bytes.length === 0) {
      return jsonResponse({ success: false, message: 'Archivo vacío' });
    }
    if (bytes.length > MAX_IMAGE_BYTES) {
      return jsonResponse({ success: false, message: 'Imagen demasiado grande' });
    }
    if (!isAllowedImageBytes(bytes, contentType)) {
      return jsonResponse({ success: false, message: 'El archivo no parece ser una imagen válida' });
    }

    const base64 = Utilities.base64Encode(bytes);
    return jsonResponse({
      success: true,
      fileId: id,
      contentType: contentType,
      base64: base64
    });
  } catch (error) {
    Logger.log('Error en getPhoto: ' + error);
    return jsonResponse({ success: false, message: 'Error al obtener foto: ' + error.toString() });
  }
}

/**
 * Función auxiliar para eliminar una foto (opcional)
 */
function deletePhoto(fileId) {
  try {
    // Eliminar de Drive
    const file = DriveApp.getFileById(fileId);
    file.setTrashed(true);
    
    // Eliminar de Sheets
    const ss = SpreadsheetApp.openById(GALLERY_SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const fileIdCol = headers.indexOf('File_ID');
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][fileIdCol] === fileId) {
        sheet.deleteRow(i + 1);
        break;
      }
    }
    
    return jsonResponse({
      success: true,
      message: 'Foto eliminada exitosamente'
    });
    
  } catch (error) {
    Logger.log('Error en deletePhoto: ' + error);
    return jsonResponse({
      success: false,
      message: 'Error al eliminar foto: ' + error.toString()
    });
  }
}
