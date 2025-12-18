const SPREADSHEET_ID = '1tFt-UjwaQS80uM1ECrMxnLJGU-MWO9lWnxZyPnYV530';
const SHEET_NAME = 'RSVP-Boda-KarlaJose';

const EMAIL_DESTINATARIO = 'karla.y.jose.18.12.26@gmail.com'; 

/**
 * Función principal que maneja las solicitudes GET
 */
function doGet(e) {
  try {
    // Obtener parámetros de la URL
    const params = e.parameter;
    const action = params.action;
    
    if (!action) {
      return ContentService.createTextOutput('RSVP API funcionando correctamente');
    }
    
    if (action === 'searchGuest') {
      return searchGuestByName(params.name);
    } else if (action === 'updateAttendance') {
      // Decodificar el JSON de updates
      const updates = JSON.parse(params.updates);
      return updateGuestAttendance(updates);
    } else if (action === 'verifyTicket') {
      return verifyTicket(params.ticketId);
    } else if (action === 'getTicketQr') {
      return getTicketQr(params.ticketId);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      result: 'error',
      message: 'Acción no válida'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      result: 'error',
      message: 'Error en el servidor: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Función para manejar solicitudes POST (por compatibilidad)
 */
function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const action = params.action;
    
    if (action === 'searchGuest') {
      return searchGuestByName(params.name);
    } else if (action === 'updateAttendance') {
      return updateGuestAttendance(params.updates);
    } else if (action === 'verifyTicket') {
      return verifyTicket(params.ticketId);
    } else if (action === 'getTicketQr') {
      return getTicketQr(params.ticketId);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      result: 'error',
      message: 'Acción no válida'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      result: 'error',
      message: 'Error en el servidor: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Buscar invitado por nombre y retornar su grupo
 */
function searchGuestByName(searchName) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    
    // Asumiendo que la primera fila contiene los encabezados
    const headers = data[0];
    const idNombreCol = headers.indexOf('ID_NOMBRE');
    // Buscar ID_APELLIDOS (plural) o ID_APELLIDO (singular)
    let idApellidoCol = headers.indexOf('ID_APELLIDOS');
    if (idApellidoCol === -1) {
      idApellidoCol = headers.indexOf('ID_APELLIDO');
    }
    const idGrupoCol = headers.indexOf('ID_GRUPO');
    const estadoCol = headers.indexOf('ID_ESTADO');
    
    if (idNombreCol === -1 || idApellidoCol === -1 || idGrupoCol === -1) {
      return ContentService.createTextOutput(JSON.stringify({
        result: 'error',
        message: 'No se encontraron las columnas necesarias. Columnas encontradas: ' + headers.join(', ')
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Buscar el invitado
    let foundGroup = null;
    const normalizedSearch = normalizeText(searchName);
    
    for (let i = 1; i < data.length; i++) {
      const nombre = normalizeText(data[i][idNombreCol]);
      const apellido = normalizeText(data[i][idApellidoCol]);
      const nombreCompleto = nombre + ' ' + apellido;
      
      if (nombreCompleto.includes(normalizedSearch) || 
          normalizedSearch.includes(nombreCompleto) ||
          nombre.includes(normalizedSearch) ||
          apellido.includes(normalizedSearch)) {
        foundGroup = data[i][idGrupoCol];
        break;
      }
    }
    
    if (!foundGroup) {
      return ContentService.createTextOutput(JSON.stringify({
        result: 'not_found',
        message: 'No encontramos tu nombre en la lista de invitados. Por favor verifica la escritura.'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Obtener todos los invitados del mismo grupo
    const groupGuests = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][idGrupoCol] === foundGroup) {
        const row = {
          rowIndex: i + 1, // +1 porque las filas de Sheets empiezan en 1
          nombre: data[i][idNombreCol],
          apellido: data[i][idApellidoCol],
          estado: estadoCol !== -1 ? data[i][estadoCol] : 'Pendiente',
          grupo: data[i][idGrupoCol]
        };
        groupGuests.push(row);
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      result: 'success',
      grupo: foundGroup,
      invitados: groupGuests
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      result: 'error',
      message: 'Error al buscar invitado: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Actualizar estado de asistencia de invitados
 */
function updateGuestAttendance(updates) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    let headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const estadoCol = headers.indexOf('ID_ESTADO') + 1; // +1 porque getRange usa 1-index
    const nombreCol = headers.indexOf('ID_NOMBRE') + 1;
    // Buscar ID_APELLIDOS (plural) o ID_APELLIDO (singular)
    let apellidoCol = headers.indexOf('ID_APELLIDOS') + 1;
    if (apellidoCol === 0) {
      apellidoCol = headers.indexOf('ID_APELLIDO') + 1;
    }
    const grupoCol = headers.indexOf('ID_GRUPO') + 1;

    // Ensure a ticket column exists
    let ticketIdCol = headers.indexOf('TICKET_ID') + 1;
    if (ticketIdCol === 0) {
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue('TICKET_ID');
      headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      ticketIdCol = headers.indexOf('TICKET_ID') + 1;
    }
    
    if (estadoCol === 0) {
      return ContentService.createTextOutput(JSON.stringify({
        result: 'error',
        message: 'No se encontró la columna ID_ESTADO'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (nombreCol === 0 || apellidoCol === 0 || grupoCol === 0) {
      return ContentService.createTextOutput(JSON.stringify({
        result: 'error',
        message: 'No se encontraron las columnas necesarias (ID_NOMBRE, ID_APELLIDO(S), ID_GRUPO)'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Array para almacenar los cambios realizados
    const cambios = [];
    let grupoNombre = '';

    // Determine if we should generate a group ticket ID (only if there is at least one confirmed guest)
    const confirmedRowIndexes = [];
    
    // Actualizar cada invitado y guardar información del cambio
    updates.forEach(function(update) {
      const rowData = sheet.getRange(update.rowIndex, 1, 1, sheet.getLastColumn()).getValues()[0];
      const estadoAnterior = rowData[estadoCol - 1];
      const nombre = rowData[nombreCol - 1];
      const apellido = rowData[apellidoCol - 1];
      const grupo = rowData[grupoCol - 1];
      
      // Guardar el nombre del grupo (será el mismo para todos)
      if (!grupoNombre) {
        grupoNombre = grupo;
      }
      
      // Actualizar el estado
      sheet.getRange(update.rowIndex, estadoCol).setValue(update.estado);

      // Track confirmed guests for ticket issuance
      if (update.estado === 'Confirmado') {
        confirmedRowIndexes.push(update.rowIndex);
      }
      
      // Guardar información del cambio
      cambios.push({
        nombre: nombre + ' ' + apellido,
        estadoAnterior: estadoAnterior || 'Sin estado',
        estadoNuevo: update.estado
      });
    });

    // Issue (or revoke) ticket IDs
    let ticketId = '';
    if (confirmedRowIndexes.length > 0) {
      const uuid = Utilities.getUuid().replace(/-/g, '').toUpperCase();
      ticketId = uuid.slice(0, 12);
    }

    // Apply ticketId to confirmed rows and clear it for non-confirmed rows touched by this update
    updates.forEach(function(update) {
      if (ticketIdCol === 0) return;
      const value = (update.estado === 'Confirmado') ? ticketId : '';
      sheet.getRange(update.rowIndex, ticketIdCol).setValue(value);
    });
    
    // Enviar correo electrónico con los cambios
    enviarCorreoConfirmacion(grupoNombre, cambios);
    
    return ContentService.createTextOutput(JSON.stringify({
      result: 'success',
      message: '¡Confirmación guardada exitosamente!',
      ticketId: ticketId
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      result: 'error',
      message: 'Error al actualizar asistencia: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Verifica un boleto por su ticketId
 */
function verifyTicket(ticketId) {
  try {
    const id = String(ticketId || '').trim().toUpperCase();
    if (!id) {
      return ContentService.createTextOutput(JSON.stringify({
        result: 'error',
        message: 'ticketId requerido'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    if (!data || data.length < 2) {
      return ContentService.createTextOutput(JSON.stringify({
        result: 'not_found',
        valid: false,
        message: 'No hay datos para verificar'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const headers = data[0].map(String);
    const estadoCol = headers.indexOf('ID_ESTADO');
    const nombreCol = headers.indexOf('ID_NOMBRE');
    let apellidoCol = headers.indexOf('ID_APELLIDOS');
    if (apellidoCol === -1) apellidoCol = headers.indexOf('ID_APELLIDO');
    const grupoCol = headers.indexOf('ID_GRUPO');
    const ticketCol = headers.indexOf('TICKET_ID');

    if (ticketCol === -1) {
      return ContentService.createTextOutput(JSON.stringify({
        result: 'not_found',
        valid: false,
        message: 'No existe columna TICKET_ID'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const matches = [];
    let groupName = '';
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowTicket = String(row[ticketCol] || '').trim().toUpperCase();
      if (rowTicket !== id) continue;

      const estado = estadoCol !== -1 ? String(row[estadoCol] || '') : '';
      if (estado !== 'Confirmado') continue;

      const nombre = nombreCol !== -1 ? String(row[nombreCol] || '') : '';
      const apellido = apellidoCol !== -1 ? String(row[apellidoCol] || '') : '';
      const fullName = (nombre + ' ' + apellido).trim();
      if (fullName) matches.push(fullName);
      if (!groupName && grupoCol !== -1) groupName = String(row[grupoCol] || '');
    }

    if (matches.length === 0) {
      return ContentService.createTextOutput(JSON.stringify({
        result: 'not_found',
        valid: false,
        message: 'Boleto no válido'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      result: 'success',
      valid: true,
      ticketId: id,
      grupo: groupName,
      invitados: matches
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      result: 'error',
      message: 'Error al verificar boleto: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Genera un QR (PNG Data URL) para validar un ticket.
 * Devuelve un data URL para que el frontend lo dibuje en canvas sin problemas de CORS/taint.
 */
function getTicketQr(ticketId) {
  try {
    const id = String(ticketId || '').trim().toUpperCase();
    if (!id) {
      return ContentService.createTextOutput(JSON.stringify({
        result: 'error',
        message: 'ticketId requerido'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const baseUrl = ScriptApp.getService().getUrl();
    const verifyUrl = baseUrl + '?action=verifyTicket&ticketId=' + encodeURIComponent(id);

    // Use Google Chart API to render the QR server-side.
    const qrUrl = 'https://chart.googleapis.com/chart?cht=qr&chs=240x240&chld=M|1&chl=' + encodeURIComponent(verifyUrl);
    const resp = UrlFetchApp.fetch(qrUrl, { muteHttpExceptions: true, followRedirects: true });
    const code = resp.getResponseCode();
    if (code < 200 || code >= 300) {
      return ContentService.createTextOutput(JSON.stringify({
        result: 'error',
        message: 'No se pudo generar el QR (HTTP ' + code + ')'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const bytes = resp.getContent();
    const base64 = Utilities.base64Encode(bytes);
    const dataUrl = 'data:image/png;base64,' + base64;

    return ContentService.createTextOutput(JSON.stringify({
      result: 'success',
      ticketId: id,
      verifyUrl: verifyUrl,
      qrDataUrl: dataUrl
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      result: 'error',
      message: 'Error al generar QR: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Enviar correo electrónico con los cambios de confirmación
 */
function enviarCorreoConfirmacion(grupoNombre, cambios) {
  try {
    const fecha = new Date();
    const fechaFormateada = Utilities.formatDate(fecha, 'America/Mexico_City', 'dd/MM/yyyy HH:mm:ss');
    
    // Construir el cuerpo del mensaje
    let mensaje = `
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; color: #333; }
    .header { background-color: #2E8B57; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .grupo { background-color: #f9f9f9; padding: 15px; border-left: 4px solid #d4af37; margin: 20px 0; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background-color: #2E8B57; color: white; padding: 12px; text-align: left; }
    td { padding: 10px; border-bottom: 1px solid #ddd; }
    tr:hover { background-color: #f5f5f5; }
    .confirmado { color: #2E8B57; font-weight: bold; }
    .no-asiste { color: #dc3545; font-weight: bold; }
    .pendiente { color: #ffc107; font-weight: bold; }
    .footer { background-color: #f9f9f9; padding: 15px; text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h2>💒 Nueva Confirmación de Asistencia</h2>
    <p>Boda Karla & Jose</p>
  </div>
  
  <div class="content">
    <p><strong>Fecha y hora:</strong> ${fechaFormateada}</p>
    
    <div class="grupo">
      <h3>📋 Grupo: ${grupoNombre}</h3>
      <p>Se han actualizado ${cambios.length} invitado(s)</p>
    </div>
    
    <table>
      <thead>
        <tr>
          <th>Invitado</th>
          <th>Estado Anterior</th>
          <th>Estado Nuevo</th>
        </tr>
      </thead>
      <tbody>
`;
    
    // Agregar cada cambio a la tabla
    cambios.forEach(function(cambio) {
      let claseEstado = 'pendiente';
      if (cambio.estadoNuevo === 'Confirmado') claseEstado = 'confirmado';
      else if (cambio.estadoNuevo === 'No Asiste') claseEstado = 'no-asiste';
      
      mensaje += `
        <tr>
          <td>${cambio.nombre}</td>
          <td>${cambio.estadoAnterior}</td>
          <td class="${claseEstado}">${cambio.estadoNuevo}</td>
        </tr>
      `;
    });
    
    mensaje += `
      </tbody>
    </table>
    
    <p style="margin-top: 20px;">
      <a href="https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}" 
         style="background-color: #2E8B57; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
        Ver Google Sheet
      </a>
    </p>
  </div>
  
  <div class="footer">
    <p>Este correo se generó automáticamente desde el sistema RSVP de la boda.</p>
    <p>No responder a este mensaje.</p>
  </div>
</body>
</html>
`;
    
    // Enviar el correo
    MailApp.sendEmail({
      to: EMAIL_DESTINATARIO,
      subject: `✅ Confirmación RSVP: ${grupoNombre}`,
      htmlBody: mensaje
    });
    
  } catch (error) {
    Logger.log('Error al enviar correo: ' + error.toString());
    // No interrumpimos el proceso si falla el correo
  }
}

/**
 * Normalizar texto para comparación (sin acentos, minúsculas, sin espacios extra)
 */
function normalizeText(text) {
  if (!text) return '';
  return text.toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
}
