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

function displayValidTicket(data) {
    // Display ticket code
    codeValueEl.textContent = data.ticketId;
    
    // Display list of confirmed guests
    const guests = data.invitados || [];
    if (guests.length > 0) {
        guestListEl.innerHTML = guests
            .map(guest => '<div class="guest-item">' + escapeHtml(guest) + '</div>')
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
