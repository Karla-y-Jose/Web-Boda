// ========== CONFIGURACIÓN ==========
const DRIVE_FOLDER_ID = '1hKX5k9xZfphAo2FzdvB2osMWbRimOZxo';  // ID de la carpeta de Google Drive
const GALLERY_SPREADSHEET_ID = '1YZbX8HIpzAttLVtE2CUTBi5tMgbD98RhXMhq-F7T5sk';  // ID del Google Sheet
const SHEET_NAME = 'Galeria';  // Nombre de la hoja en el Sheet

// Email para notificaciones
const EMAIL_NOTIFICACION = 'karla.y.jose.18.12.26@gmail.com';

/**
 * Función principal para manejar peticiones POST (subida de fotos)
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    if (action === 'uploadPhoto') {
      return uploadPhoto(data);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'Acción no válida'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Error en doPost: ' + error);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'Error: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
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
      return getPhotos(section);
    }
    
    return ContentService.createTextOutput('Gallery API funcionando correctamente');
    
  } catch (error) {
    Logger.log('Error en doGet: ' + error);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'Error: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Subir foto a Google Drive y registrar en Sheets
 */
function uploadPhoto(data) {
  try {
    const guestName = data.guestName;
    const photoData = data.photoData; // Base64 string
    const fileName = data.fileName;
    const section = data.section || 'invitados'; // pedida, savethedate, boda, invitados
    
    if (!guestName || !photoData || !fileName) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: 'Faltan datos requeridos'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Obtener carpeta de Google Drive
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    
    // Decodificar base64 y crear archivo
    const contentType = photoData.match(/data:([^;]+);/)[1];
    const base64Data = photoData.replace(/^data:image\/\w+;base64,/, '');
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), contentType, fileName);
    
    // Subir archivo a Drive
    const file = folder.createFile(blob);
    
    // Hacer el archivo público (IMPORTANTE: debe ser visible para cualquiera con el enlace)
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Obtener URL pública en formato que funcione en <img> tags
    // Este formato de URL funciona directamente en navegadores
    const fileId = file.getId();
    const publicUrl = `https://lh3.googleusercontent.com/d/${fileId}=s4000?authuser=0`;
    
    // Registrar en Google Sheets
    const ss = SpreadsheetApp.openById(GALLERY_SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    
    // Si la hoja no existe, crearla
    if (!sheet) {
      const newSheet = ss.insertSheet(SHEET_NAME);
      newSheet.appendRow(['Timestamp', 'Nombre_Invitado', 'URL_Foto', 'File_ID', 'Seccion', 'Nombre_Archivo']);
    }
    
    const sheetToUse = ss.getSheetByName(SHEET_NAME);
    const timestamp = new Date();
    
    sheetToUse.appendRow([
      timestamp,
      guestName,
      publicUrl,
      fileId,
      section,
      fileName
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
          
          Ver foto: ${publicUrl}
          
          ¡Saludos!
        `
      });
    } catch (emailError) {
      Logger.log('Error enviando email: ' + emailError);
      // No fallar si el email falla
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Foto subida exitosamente',
      photo: {
        url: publicUrl,
        guestName: guestName,
        timestamp: timestamp,
        section: section
      }
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Error en uploadPhoto: ' + error);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'Error al subir foto: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Obtener todas las fotos o filtradas por sección
 */
function getPhotos(section) {
  try {
    const ss = SpreadsheetApp.openById(GALLERY_SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        photos: []
      })).setMimeType(ContentService.MimeType.JSON);
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
    
    // Recorrer filas (saltando header)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const photoSection = row[seccionCol] || 'invitados';
      
      // Filtrar por sección si se especifica
      if (section !== 'all' && photoSection !== section) {
        continue;
      }
      
      photos.push({
        timestamp: row[timestampCol],
        guestName: row[nombreCol],
        url: row[urlCol],
        fileId: row[fileIdCol],
        section: photoSection,
        fileName: row[archivoCol]
      });
    }
    
    // Ordenar por timestamp descendente (más recientes primero)
    photos.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      photos: photos,
      total: photos.length
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Error en getPhotos: ' + error);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'Error al obtener fotos: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
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
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Foto eliminada exitosamente'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Error en deletePhoto: ' + error);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'Error al eliminar foto: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
