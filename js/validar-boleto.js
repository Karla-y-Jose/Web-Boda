const RSVP_ENDPOINT = 'https://script.google.com/macros/s/AKfycbyhpyTZIsYGVzv2zbNMyTvW1ZX0Unoz8iwhV__gXfVi5xuW7erTy8scjCpM71UUC39bqw/exec';

// Get ticket ID from URL parameters (case-insensitive)
const urlParams = new URLSearchParams(window.location.search);
const ticketId = urlParams.get('ticketId') || urlParams.get('ticketid');

const ticketBody = document.getElementById('ticket-body');
const errorBody = document.getElementById('error-body');
const errorMessage = document.getElementById('error-message');
const loadingBody = document.getElementById('loading-body');
const codeValueEl = document.getElementById('code-value');
const guestListEl = document.getElementById('guest-list');
const tableSectionEl = document.getElementById('table-section');
const tableLabelEl = document.getElementById('table-label');
const tableValueEl = document.getElementById('table-value');

// If no ticketId provided, show error immediately
if (!ticketId) {
    errorMessage.textContent = 'Código no proporcionado';
    showBody('error');
} else {
    // Show loading state
    showBody('loading');
    
    // Verify ticket with RSVP system
    verifyTicketWithRSVP(ticketId);
}

function showBody(bodyType) {
    ticketBody.style.display = 'none';
    errorBody.style.display = 'none';
    loadingBody.style.display = 'none';
    
    if (bodyType === 'ticket') {
        ticketBody.style.display = 'block';
    } else if (bodyType === 'error') {
        errorBody.style.display = 'block';
    } else if (bodyType === 'loading') {
        loadingBody.style.display = 'block';
    }
}

function verifyTicketWithRSVP(ticketId) {
    // Build the verification URL with CORS considerations
    const verifyUrl = RSVP_ENDPOINT + '?action=verifyTicket&ticketId=' + encodeURIComponent(ticketId);
    
    fetch(verifyUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network error: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            // Check if ticket is valid
            if (data.valid && data.invitados && data.invitados.length > 0) {
                displayValidTicket(data);
            } else {
                displayError(data.message || 'Código inválido o no confirmado');
            }
        })
        .catch(error => {
            console.error('Error verifying ticket:', error);
            displayError('Error al verificar el código. Por favor intenta de nuevo.');
        });
}

function formatTableText(tableStr) {
    if (!tableStr) return '';
    const clean = String(tableStr).trim();
    if (/^mesa/i.test(clean)) {
        return clean;
    }
    if (clean.includes(',')) {
        return 'Mesas ' + clean;
    }
    return 'Mesa ' + clean;
}

function displayValidTicket(data) {
    console.log('Ticket verification response:', data);

    // Display ticket code
    codeValueEl.textContent = data.ticketId;
    
    // Extract table assignment from all possible response formats
    let tableAssigned = data.mesa || data.id_mesa || data.ID_MESA || '';
    if (!tableAssigned && Array.isArray(data.mesas) && data.mesas.length > 0) {
        tableAssigned = data.mesas.filter(Boolean).join(', ');
    }
    if (!tableAssigned && Array.isArray(data.invitadosDetalle)) {
        const unique = [];
        data.invitadosDetalle.forEach(g => {
            if (g && g.mesa && unique.indexOf(String(g.mesa).trim()) === -1) {
                unique.push(String(g.mesa).trim());
            }
        });
        tableAssigned = unique.join(', ');
    }

    // Display table section
    if (tableSectionEl && tableValueEl) {
        if (tableAssigned) {
            const formatted = formatTableText(tableAssigned);
            tableValueEl.textContent = formatted;
            if (tableLabelEl) {
                tableLabelEl.textContent = formatted.toLowerCase().startsWith('mesas') ? 'Mesas Asignadas' : 'Mesa Asignada';
            }
        } else {
            tableValueEl.textContent = 'Por asignar';
            if (tableLabelEl) {
                tableLabelEl.textContent = 'Mesa Asignada';
            }
        }
        tableSectionEl.style.display = 'block';
    }
    
    // Display list of confirmed guests
    // Supports both detailed objects and simple string arrays
    const detailedGuests = data.invitadosDetalle || data.invitados || [];
    const hasMultipleDifferentTables = Array.isArray(data.mesas) && data.mesas.length > 1;

    if (detailedGuests.length > 0) {
        guestListEl.innerHTML = detailedGuests
            .map(guest => {
                const isObj = typeof guest === 'object' && guest !== null;
                const name = isObj ? (guest.nombre || '') : String(guest);
                const guestMesa = isObj && guest.mesa ? formatTableText(guest.mesa) : '';

                let html = '<div class="guest-item">';
                html += '<span class="guest-item-name">' + escapeHtml(name) + '</span>';
                if (guestMesa && (hasMultipleDifferentTables || !tableAssigned)) {
                    html += '<span class="guest-item-table">' + escapeHtml(guestMesa) + '</span>';
                }
                html += '</div>';
                return html;
            })
            .join('');
    } else {
        guestListEl.textContent = '—';
    }
    
    showBody('ticket');
}

function displayError(message) {
    errorMessage.textContent = message;
    showBody('error');
}

// Helper function to escape HTML and prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
