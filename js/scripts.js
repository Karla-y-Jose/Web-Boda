/* ============================================
   WEDDING WEBSITE - MAIN SCRIPTS
   ============================================ */

$(document).ready(function() {
    // ========== Waypoints Animations ==================
    $('.wp1').waypoint(function () {
        $('.wp1').addClass('animated fadeInLeft');
    }, {
        offset: '75%'
    }); 
    $('.wp2').waypoint(function () {
        $('.wp2').addClass('animated fadeInRight');
    }, {
        offset: '75%'
    });
    $('.wp3').waypoint(function () {
        $('.wp3').addClass('animated fadeInLeft');
    }, {
        offset: '75%'
    });
    $('.wp4').waypoint(function () {
        $('.wp4').addClass('animated fadeInRight');
    }, {
        offset: '75%'
    });
    $('.wp5').waypoint(function () {
        $('.wp5').addClass('animated fadeInLeft');
    }, {
        offset: '75%'
    });
    $('.wp6').waypoint(function () {
        $('.wp6').addClass('animated fadeInRight');
    }, {
        offset: '75%'
    });
    $('.wp7').waypoint(function () {
        $('.wp7').addClass('animated fadeInUp');
    }, {
        offset: '75%'
    });
    $('.wp8').waypoint(function () {
        $('.wp8').addClass('animated fadeInLeft');
    }, {
        offset: '75%'
    });
    $('.wp9').waypoint(function () {
        $('.wp9').addClass('animated fadeInRight');
    }, {
        offset: '75%'
    });

    // ========== Family Cards Animations ==================
    $('.family-fade-left').waypoint(function (direction) {
        if (direction === 'down') {
            $(this.element).removeClass('animated-out').addClass('animated');
        } else {
            $(this.element).removeClass('animated').addClass('animated-out');
        }
    }, {
        offset: '85%'
    });
    $('.family-fade-right').waypoint(function (direction) {
        if (direction === 'down') {
            $(this.element).removeClass('animated-out').addClass('animated');
        } else {
            $(this.element).removeClass('animated').addClass('animated-out');
        }
    }, {
        offset: '85%'
    });

    // ========== Nav Transformicon ==================
    /* When user clicks the Icon */
    $('.nav-toggle').click(function (e) {
        $(this).toggleClass('active');
        $('.header-nav').toggleClass('open');
        e.preventDefault();
    });
    
    /* When user clicks a link */
    $('.header-nav li a').click(function () {
        $('.nav-toggle').toggleClass('active');
        $('.header-nav').toggleClass('open');
    });

    // ========== Header BG Scroll ==================
    $(function () {
        $(window).scroll(function () {
            var scroll = $(window).scrollTop();

            if (scroll >= 20) {
                $('section.navigation').addClass('fixed');
                // add class to header to hide the pseudo-element keyline
                $('header').addClass('scrolled').css({
                    "padding": "35px 0"
                });
            } else {
                $('section.navigation').removeClass('fixed');
                // remove the class so the keyline (header::after) is visible again
                $('header').removeClass('scrolled').css({
                    "padding": "50px 0"
                });
            }
        });
    });

    // ========== Countdown Timer ==========
    updateCountdown();
    setInterval(updateCountdown, 1000);

    // ========== RSVP Form Handling (Google Sheets via Apps Script) ==========
    // Configure RSVP_ENDPOINT with your deployed Google Apps Script web app URL
    // IMPORTANT: Replace this URL with your deployed Apps Script URL
    var RSVP_ENDPOINT = 'https://script.google.com/macros/s/AKfycbx_6CBQaLmuFTzuG9_gi2nGU7nDN0YieWlcgHS92TevwYralGueUGUq3Keuoh6gF29DMA/exec';

    // Expose for global helpers (ticket QR generation lives outside document.ready)
    window.__RSVP_ENDPOINT = RSVP_ENDPOINT;

    // RSVP security state (email + pre-shared group code)
    window.__rsvpAuthToken = '';
    window.__rsvpVerifiedEmail = '';
    
    var currentGuests = [];

    // Search guest by name
    $('#rsvp-search-form').on('submit', function(e) {
        e.preventDefault();
        var searchName = $('#rsvp-search-name').val().trim();
        var email = String($('#rsvp-search-email').val() || '').trim();
        var groupCode = String($('#rsvp-group-code').val() || '').trim();
        var $btn = $(this).find('button[type="submit"]');
        
        if (!searchName) {
            $('#alert-wrapper').html(alert_markup('warning', 'Por favor ingresa tu nombre.'));
            return;
        }

        if (!email) {
            $('#alert-wrapper').html(alert_markup('warning', 'Por favor ingresa tu correo.'));
            return;
        }

        if (!groupCode) {
            $('#alert-wrapper').html(alert_markup('warning', 'Por favor ingresa tu código de grupo.'));
            return;
        }

        // Reset previous auth state on a new search
        window.__rsvpAuthToken = '';
        window.__rsvpVerifiedEmail = '';
        window.__rsvpGroupCode = '';
        
        $('#alert-wrapper').html(alert_markup('info', '<strong>Buscando...</strong> Por favor espera.'));
        $btn.prop('disabled', true);
        
        // Use GET with URL params to avoid CORS issues
        $.ajax({
            url: RSVP_ENDPOINT + '?action=searchGuest&name=' + encodeURIComponent(searchName) + '&email=' + encodeURIComponent(email) + '&groupCode=' + encodeURIComponent(groupCode),
            method: 'GET',
            dataType: 'json'
        })
        .done(function(response) {
            if (response.result === 'success') {
                // Backward-compatible path (if server returns guests directly)
                if (response.token) {
                    window.__rsvpAuthToken = String(response.token || '').trim();
                    window.__rsvpVerifiedEmail = email;
                    window.__rsvpGroupCode = groupCode;
                }
                currentGuests = response.invitados;
                displayGuestList(response.grupo, response.invitados);
            } else if (response.result === 'not_found') {
                $('#alert-wrapper').html(alert_markup('warning', response.message));
            } else {
                $('#alert-wrapper').html(alert_markup('danger', '<strong>Error:</strong> ' + response.message));
            }
        })
        .fail(function(err) {
            console.error('Search error:', err);
            $('#alert-wrapper').html(alert_markup('danger', '<strong>Error de conexión.</strong> Por favor intenta más tarde.'));
        })
        .always(function() {
            $btn.prop('disabled', false);
        });
    });

    // Show guest list
    function displayGuestList(groupName, guests) {
        $('#alert-wrapper').html('');
        $('#rsvp-search-container').hide();
        $('#rsvp-guest-list').show();
        $('#group-name').text(groupName);
        
        var guestsHtml = '';
        guests.forEach(function(guest, index) {
            var currentState = guest.estado || 'Pendiente';
            guestsHtml += `
                <div class="guest-item" data-row-index="${guest.rowIndex}">
                    <div class="guest-name">
                        <i class="fa fa-user"></i>
                        ${guest.nombre} ${guest.apellido}
                    </div>
                    <div class="attendance-options">
                        <div class="attendance-option confirmed">
                            <label>
                                <input type="radio" name="guest_${index}" value="Confirmado" ${currentState === 'Confirmado' ? 'checked' : ''}>
                                <span><i class="fa fa-check-circle"></i> Confirmar</span>
                            </label>
                        </div>
                        <div class="attendance-option not-attending">
                            <label>
                                <input type="radio" name="guest_${index}" value="No Asiste" ${currentState === 'No Asiste' ? 'checked' : ''}>
                                <span><i class="fa fa-times-circle"></i> No Asistirá</span>
                            </label>
                        </div>
                        <div class="attendance-option pending">
                            <label>
                                <input type="radio" name="guest_${index}" value="Pendiente" ${currentState === 'Pendiente' ? 'checked' : ''}>
                                <span><i class="fa fa-clock-o"></i> Pendiente</span>
                            </label>
                        </div>
                    </div>
                </div>
            `;
        });
        
        $('#guests-container').html(guestsHtml);
    }

    // Confirm attendance
    $('#confirm-attendance-btn').on('click', function() {
        if (!window.__rsvpAuthToken) {
            $('#confirm-alert-wrapper').html(alert_markup('danger', '<strong>Error:</strong> Primero realiza la búsqueda con tu código para continuar.'));
            return;
        }

        var $btn = $(this);
        var updates = [];
        var confirmedGuestNames = [];
        var groupName = String($('#group-name').text() || '').trim();
        
        $('.guest-item').each(function(index) {
            var rowIndex = $(this).data('row-index');
            var selectedState = $(this).find('input[type="radio"]:checked').val();

            if (selectedState === 'Confirmado' && Array.isArray(currentGuests) && currentGuests[index]) {
                var g = currentGuests[index];
                confirmedGuestNames.push(String((g.nombre || '') + ' ' + (g.apellido || '')).trim());
            }
            
            updates.push({
                rowIndex: rowIndex,
                estado: selectedState
            });
        });

        // Store ticket payload for the confirmation modal.
        window.__rsvpTicketPayload = {
            groupName: groupName,
            confirmedGuests: confirmedGuestNames.filter(Boolean),
            generatedAt: Date.now(),
            ticketId: ''
        };
        
        $('#confirm-alert-wrapper').html(alert_markup('info', '<strong>Guardando...</strong> Por favor espera.'));
        $btn.prop('disabled', true);
        
        // Serialize updates to JSON and URL-encode for the query string
        var updatesJson = encodeURIComponent(JSON.stringify(updates));
        
        $.ajax({
            url: RSVP_ENDPOINT + '?action=updateAttendance&updates=' + updatesJson + '&token=' + encodeURIComponent(window.__rsvpAuthToken),
            method: 'GET',
            dataType: 'json'
        })
        .done(function(response) {
            if (response.result === 'success') {
                // Attach server-issued ticket code (verifiable against the sheet)
                if (response.ticketId && window.__rsvpTicketPayload) {
                    window.__rsvpTicketPayload.ticketId = String(response.ticketId || '').trim();
                }
                $('#confirm-alert-wrapper').html(alert_markup('success', '<strong>¡Listo!</strong> ' + response.message));
                
                // Show confirmation modal
                setTimeout(function() {
                    $('#rsvp-modal').addClass('active');
                    
                    // Add calendar buttons with the same behavior as the events section
                    var tickets = (window.__rsvpTicketPayload && Array.isArray(window.__rsvpTicketPayload.confirmedGuests))
                        ? window.__rsvpTicketPayload.confirmedGuests
                        : [];
                    var ticketButtonHtml = '';
                    if (tickets.length > 0) {
                        var label = tickets.length === 1 ? 'Descargar boleto' : 'Descargar boletos';
                        ticketButtonHtml = `
                            <button type="button"
                                    onclick="downloadRsvpTickets()"
                                    class="btn btn-fill calendar-btn-modal"
                                    style="width: 100%;">
                                <i class="fa fa-ticket" style="margin-right: 8px;"></i> ${label}
                            </button>
                        `;
                    }

                    var calendarButtons = `
                        <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 20px;">
                            <button onclick="agregarAlCalendario('Boda Karla & Jose', 'Ceremonia: Parroquia Nuestra Señora de Altagracia, Zapopan, Jal. | Recepción: Jardin de Eventos Andira, Nuevo México, Jal.', '20261218T180000', '20261219T020000')" 
                                    class="btn btn-fill calendar-btn-modal" 
                                    style="width: 100%;">
                                <i class="fa fa-calendar" style="margin-right: 8px;"></i> Añadir al Calendario
                            </button>
                            ${ticketButtonHtml}
                        </div>
                    `;
                    $('#add-to-cal').html(calendarButtons);
                }, 1500);
            } else {
                $('#confirm-alert-wrapper').html(alert_markup('danger', '<strong>Error:</strong> ' + response.message));
            }
        })
        .fail(function(err) {
            console.error('Update error:', err);
            $('#confirm-alert-wrapper').html(alert_markup('danger', '<strong>Error de conexión.</strong> Por favor intenta más tarde.'));
        })
        .always(function() {
            $btn.prop('disabled', false);
        });
    });

    // Back to search
    $('#back-to-search-btn').on('click', function() {
        $('#rsvp-guest-list').hide();
        $('#rsvp-search-container').show();
        $('#rsvp-search-name').val('');
        $('#rsvp-search-email').val('');
        $('#rsvp-group-code').val('');
        window.__rsvpAuthToken = '';
        window.__rsvpVerifiedEmail = '';
        window.__rsvpGroupCode = '';
        $('#alert-wrapper').html('');
        $('#confirm-alert-wrapper').html('');
    });
     
    // Helper function for alert markup
     function alert_markup(alert_type, msg) {
         return '<div class="alert alert-' + alert_type + '" role="alert" style="margin-bottom: 20px;">' 
                + msg + 
                '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span>&times;</span></button></div>';
     }
});

function downloadRsvpTickets() {
    var payload = window.__rsvpTicketPayload || null;
    var guests = payload && Array.isArray(payload.confirmedGuests) ? payload.confirmedGuests : [];
    var groupName = payload && typeof payload.groupName === 'string' ? payload.groupName : '';
    var ticketId = payload && typeof payload.ticketId === 'string' ? payload.ticketId : '';

    if (!guests.length) {
        alert('No hay boletos disponibles para descargar.');
        return;
    }

    var safeGroup = String(groupName || 'grupo')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '')
        .toLowerCase();
    var filename = guests.length === 1
        ? ('boleto-' + safeGroup + '.png')
        : ('boletos-' + safeGroup + '.png');

    // Canvas drawing needs assets loaded, so ticket generation is async.
    var qrPromise = Promise.resolve('');
    if (ticketId) {
        qrPromise = getQrDataUrlForTicket(ticketId).catch(function () { return ''; });
    }

    qrPromise
        .then(function (qrDataUrl) {
            return generateRsvpTicketPng({ groupName: groupName, guests: guests, ticketId: ticketId, qrDataUrl: qrDataUrl });
        })
        .then(function (dataUrl) {
            downloadDataUrl(dataUrl, filename);

            // Also email the ticket details to the verified email.
            if (window.__rsvpAuthToken) {
                sendTicketEmail(dataUrl, filename).catch(function (e) {
                    console.error('Ticket email failed:', e);
                    // Keep UX minimal: only an alert so the user knows it didn't send.
                    alert('No se pudo enviar el boleto por correo. Intenta de nuevo.');
                });
            }
        })
        .catch(function (e) {
            console.error('Ticket generation failed:', e);
            alert('No se pudo generar el boleto. Intenta de nuevo.');
        });
}

function sendTicketEmail(ticketDataUrl, filename) {
    var endpoint = window.__RSVP_ENDPOINT || '';
    if (!endpoint || !window.__rsvpAuthToken) return Promise.reject(new Error('Missing RSVP auth token'));

    var payload = {
        action: 'sendTicketEmail',
        token: String(window.__rsvpAuthToken),
        ticketDataUrl: String(ticketDataUrl || ''),
        filename: String(filename || '')
    };

    // Use application/x-www-form-urlencoded (simple request) to avoid CORS preflight that Apps Script doesn't handle.
    if (typeof window.$ === 'function' && $.ajax) {
        return new Promise(function (resolve, reject) {
            $.ajax({
                url: endpoint,
                method: 'POST',
                dataType: 'json',
                data: payload
            })
                .done(function (json) {
                    if (!json || json.result !== 'success') {
                        reject(new Error((json && json.message) ? json.message : 'Email failed'));
                        return;
                    }
                    resolve(json);
                })
                .fail(function (_xhr, _status, err) {
                    reject(err || new Error('Email request failed'));
                });
        });
    }

    return fetch(endpoint, {
        method: 'POST',
        body: new URLSearchParams(payload)
    })
        .then(function (resp) { return resp.json(); })
        .then(function (json) {
            if (!json || json.result !== 'success') {
                throw new Error((json && json.message) ? json.message : 'Email failed');
            }
            return json;
        });
}

function buildVerifyTicketUrl(ticketId) {
    var endpoint = window.__RSVP_ENDPOINT || '';
    if (!endpoint) return '';
    return endpoint + '?action=verifyTicket&ticketId=' + encodeURIComponent(String(ticketId || '').trim());
}

function generateQrDataUrlLocal(text, sizePx) {
    if (typeof qrcode !== 'function') {
        throw new Error('QR library not loaded');
    }
    var size = Number(sizePx) > 0 ? Number(sizePx) : 240;
    var qr = qrcode(0, 'M');
    qr.addData(String(text || ''));
    qr.make();

    var count = qr.getModuleCount();
    var canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    var ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#000000';

    var tileW = size / count;
    var tileH = size / count;

    for (var row = 0; row < count; row++) {
        for (var col = 0; col < count; col++) {
            if (!qr.isDark(row, col)) continue;
            var x = Math.round(col * tileW);
            var y = Math.round(row * tileH);
            var w = Math.ceil(tileW);
            var h = Math.ceil(tileH);
            ctx.fillRect(x, y, w, h);
        }
    }

    return canvas.toDataURL('image/png');
}

function getQrDataUrlForTicket(ticketId) {
    // Prefer server-side QR if available; fall back to local QR generation.
    return fetchTicketQrDataUrl(ticketId)
        .catch(function () {
            var verifyUrl = buildVerifyTicketUrl(ticketId);
            if (!verifyUrl) return '';
            return generateQrDataUrlLocal(verifyUrl, 240);
        });
}

function fetchTicketQrDataUrl(ticketId) {
    var endpoint = window.__RSVP_ENDPOINT || '';
    if (!endpoint) return Promise.reject(new Error('RSVP endpoint not available'));

    var url = endpoint + '?action=getTicketQr&ticketId=' + encodeURIComponent(String(ticketId || '').trim());

    // Prefer jQuery Ajax (already used elsewhere in this site) for consistent behavior.
    if (typeof window.$ === 'function' && $.ajax) {
        return new Promise(function (resolve, reject) {
            $.ajax({
                url: url,
                method: 'GET',
                dataType: 'json'
            })
                .done(function (json) {
                    if (!json || json.result !== 'success' || !json.qrDataUrl) {
                        reject(new Error((json && json.message) ? json.message : 'QR unavailable'));
                        return;
                    }
                    resolve(String(json.qrDataUrl));
                })
                .fail(function (_xhr, _status, err) {
                    reject(err || new Error('QR request failed'));
                });
        });
    }

    // Fallback: fetch
    return fetch(url, { method: 'GET' })
        .then(function (resp) { return resp.json(); })
        .then(function (json) {
            if (!json || json.result !== 'success' || !json.qrDataUrl) {
                throw new Error((json && json.message) ? json.message : 'QR unavailable');
            }
            return String(json.qrDataUrl);
        });
}

function resolveAssetUrl(path) {
    try {
        return new URL(String(path || ''), document.baseURI || window.location.href).href;
    } catch (_e) {
        return String(path || '');
    }
}

function loadImageForCanvas(src) {
    return new Promise(function (resolve, reject) {
        var img = new Image();
        // Do not force crossOrigin here; it can break loads in some local hosting setups.
        img.onload = function () { resolve(img); };
        img.onerror = function () { reject(new Error('Failed to load image: ' + src)); };
        img.src = resolveAssetUrl(src);
    });
}

function loadImageForCanvasUntainted(src) {
    var resolved = resolveAssetUrl(src);

    // Data/blob URLs are safe to draw.
    if (/^(data:|blob:)/i.test(resolved)) {
        return loadImageForCanvas(resolved);
    }

    // Best effort: fetch as a blob and draw from a same-origin blob: URL.
    // This avoids canvas tainting when the image would otherwise be treated as cross-origin.
    if (typeof fetch === 'function') {
        return fetch(resolved, { cache: 'no-store' })
            .then(function (resp) {
                if (!resp.ok) throw new Error('Image fetch failed: ' + resp.status);
                return resp.blob();
            })
            .then(function (blob) {
                var objUrl = URL.createObjectURL(blob);
                return loadImageForCanvas(objUrl)
                    .then(function (img) {
                        try { URL.revokeObjectURL(objUrl); } catch (_e) {}
                        return img;
                    })
                    .catch(function (e) {
                        try { URL.revokeObjectURL(objUrl); } catch (_e) {}
                        throw e;
                    });
            })
            .catch(function () {
                // Fallback to direct load
                return loadImageForCanvas(resolved);
            });
    }

    return loadImageForCanvas(resolved);
}

function getTicketLogoUrl() {
    // Reuse the same logo URL that is already working in the page.
    var el = document.querySelector('img[src*="logo2.png"]');
    if (el && el.src) return el.src;
    return 'img/logo2.png';
}

function drawImageContain(ctx, img, x, y, w, h) {
    var iw = img.naturalWidth || img.width;
    var ih = img.naturalHeight || img.height;
    if (!iw || !ih) return;
    var scale = Math.min(w / iw, h / ih);
    var dw = Math.round(iw * scale);
    var dh = Math.round(ih * scale);
    var dx = Math.round(x + (w - dw) / 2);
    var dy = Math.round(y + (h - dh) / 2);
    ctx.drawImage(img, dx, dy, dw, dh);
}

function generateRsvpTicketPng(opts) {
    var groupName = (opts && opts.groupName) ? String(opts.groupName) : '';
    var guests = (opts && Array.isArray(opts.guests)) ? opts.guests.map(String).filter(Boolean) : [];
    var ticketId = (opts && opts.ticketId) ? String(opts.ticketId).trim() : '';
    var qrDataUrl = (opts && opts.qrDataUrl) ? String(opts.qrDataUrl) : '';

    var canvas = document.createElement('canvas');
    canvas.width = 1400;
    canvas.height = 800;
    var ctx = canvas.getContext('2d');

    // Palette matches existing site colors.
    var greenDark = '#0F3B2E';
    var green = '#2E8B57';
    var gold = '#d4af37';
    var grayText = '#4a4a4a';

    function drawTicket(logoImg, qrImg) {
        // Background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Header band
        ctx.fillStyle = greenDark;
        ctx.fillRect(0, 0, canvas.width, 140);

        // Gold accent line
        ctx.fillStyle = gold;
        ctx.fillRect(0, 138, canvas.width, 6);

        // Logo watermark (centered)
        if (logoImg) {
            ctx.save();
            // Make it visible even if the logo is light.
            ctx.globalAlpha = 0.30;
            ctx.globalCompositeOperation = 'multiply';
            if ('filter' in ctx) {
                ctx.filter = 'grayscale(1) contrast(1.25) brightness(0.75)';
            }
            // Large watermark area in the body (under text)
            drawImageContain(ctx, logoImg, 320, 190, 760, 500);
            if ('filter' in ctx) {
                ctx.filter = 'none';
            }
            ctx.restore();
        }

        // Title
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 54px Karla, Arial, sans-serif';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText('BOLETO', 70, 92);

        // Event name
        ctx.font = '500 30px Karla, Arial, sans-serif';
        ctx.fillText('Karla & Jose', 70, 125);

        // Body
        ctx.fillStyle = grayText;
        ctx.font = '600 30px Karla, Arial, sans-serif';
        ctx.fillText('Confirmación de asistencia', 70, 210);

        ctx.fillStyle = green;
        ctx.font = '600 26px Karla, Arial, sans-serif';
        ctx.fillText('Fecha:', 70, 265);
        ctx.fillStyle = grayText;
        ctx.font = '400 26px Karla, Arial, sans-serif';
        ctx.fillText('18 de diciembre, 2026', 155, 265);

        ctx.fillStyle = green;
        ctx.font = '600 26px Karla, Arial, sans-serif';
        ctx.fillText('Grupo:', 70, 310);
        ctx.fillStyle = grayText;
        ctx.font = '400 26px Karla, Arial, sans-serif';
        ctx.fillText(groupName || '—', 160, 310);

        ctx.fillStyle = green;
        ctx.font = '600 26px Karla, Arial, sans-serif';
        ctx.fillText('Invitados confirmados:', 70, 370);

        // Guest list
        ctx.fillStyle = grayText;
        ctx.font = '400 26px Karla, Arial, sans-serif';
        var startY = 415;
        var lineHeight = 34;
        var maxLines = 8;
        for (var i = 0; i < Math.min(guests.length, maxLines); i++) {
            ctx.fillText('• ' + guests[i], 90, startY + (i * lineHeight));
        }
        if (guests.length > maxLines) {
            ctx.fillStyle = '#777';
            ctx.fillText('…y ' + (guests.length - maxLines) + ' más', 90, startY + (maxLines * lineHeight));
        }

        // Footer note
        ctx.fillStyle = '#777';
        ctx.font = '400 22px Karla, Arial, sans-serif';
        ctx.fillText('Presenta este boleto el día del evento.', 70, 730);

        // Ticket code (verifiable)
        if (ticketId) {
            ctx.fillStyle = '#777';
            ctx.font = '600 22px Karla, Arial, sans-serif';
            ctx.fillText('Código: ' + ticketId, 70, 765);
        }

        // QR for quick verification
        if (ticketId && qrImg) {
            var qrSize = 220;
            var qrX = canvas.width - (qrSize + 80);
            var qrY = canvas.height - (qrSize + 110);

            // White backing to keep QR readable
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);

            drawImageContain(ctx, qrImg, qrX, qrY, qrSize, qrSize);

            ctx.fillStyle = '#777';
            ctx.font = '400 18px Karla, Arial, sans-serif';
            ctx.fillText('Escanea para validar', qrX, qrY + qrSize + 28);
        }

        // Decorative border
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.55)';
        ctx.lineWidth = 6;
        ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

        try {
            return canvas.toDataURL('image/png');
        } catch (e) {
            // If the canvas got tainted by an image, re-render without images so the user can still download.
            if (String(e && e.name) === 'SecurityError') {
                console.warn('Ticket canvas was tainted; exporting without images.');
                // Clear and draw again without logo/QR.
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.globalAlpha = 1;
                ctx.globalCompositeOperation = 'source-over';
                if ('filter' in ctx) ctx.filter = 'none';
                // Redraw, but with null images
                // (Call the same function body by recursion guard: inline a minimal redraw)

                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = greenDark;
                ctx.fillRect(0, 0, canvas.width, 140);
                ctx.fillStyle = gold;
                ctx.fillRect(0, 138, canvas.width, 6);

                ctx.fillStyle = '#ffffff';
                ctx.font = '700 54px Karla, Arial, sans-serif';
                ctx.textBaseline = 'alphabetic';
                ctx.fillText('BOLETO', 70, 92);
                ctx.font = '500 30px Karla, Arial, sans-serif';
                ctx.fillText('Karla & Jose', 70, 125);

                ctx.fillStyle = grayText;
                ctx.font = '600 30px Karla, Arial, sans-serif';
                ctx.fillText('Confirmación de asistencia', 70, 210);

                ctx.fillStyle = green;
                ctx.font = '600 26px Karla, Arial, sans-serif';
                ctx.fillText('Fecha:', 70, 265);
                ctx.fillStyle = grayText;
                ctx.font = '400 26px Karla, Arial, sans-serif';
                ctx.fillText('18 de diciembre, 2026', 155, 265);

                ctx.fillStyle = green;
                ctx.font = '600 26px Karla, Arial, sans-serif';
                ctx.fillText('Grupo:', 70, 310);
                ctx.fillStyle = grayText;
                ctx.font = '400 26px Karla, Arial, sans-serif';
                ctx.fillText(groupName || '—', 160, 310);

                ctx.fillStyle = green;
                ctx.font = '600 26px Karla, Arial, sans-serif';
                ctx.fillText('Invitados confirmados:', 70, 370);

                ctx.fillStyle = grayText;
                ctx.font = '400 26px Karla, Arial, sans-serif';
                var startY2 = 415;
                var lineHeight2 = 34;
                var maxLines2 = 8;
                for (var j = 0; j < Math.min(guests.length, maxLines2); j++) {
                    ctx.fillText('• ' + guests[j], 90, startY2 + (j * lineHeight2));
                }
                if (guests.length > maxLines2) {
                    ctx.fillStyle = '#777';
                    ctx.fillText('…y ' + (guests.length - maxLines2) + ' más', 90, startY2 + (maxLines2 * lineHeight2));
                }

                ctx.fillStyle = '#777';
                ctx.font = '400 22px Karla, Arial, sans-serif';
                ctx.fillText('Presenta este boleto el día del evento.', 70, 730);
                if (ticketId) {
                    ctx.fillStyle = '#777';
                    ctx.font = '600 22px Karla, Arial, sans-serif';
                    ctx.fillText('Código: ' + ticketId, 70, 765);
                }

                ctx.strokeStyle = 'rgba(212, 175, 55, 0.55)';
                ctx.lineWidth = 6;
                ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

                return canvas.toDataURL('image/png');
            }
            throw e;
        }
    }

    // Use the resolved DOM URL first to avoid path issues.
    var logoPromise = loadImageForCanvasUntainted(getTicketLogoUrl())
        .catch(function () { return loadImageForCanvasUntainted('img/logo2.png'); })
        .catch(function () { return loadImageForCanvasUntainted('./img/logo2.png'); })
        .catch(function () { return null; });
    var qrPromise = qrDataUrl ? loadImageForCanvasUntainted(qrDataUrl).catch(function () { return null; }) : Promise.resolve(null);

    return Promise.all([logoPromise, qrPromise]).then(function (results) {
        var logoImg = results[0] || null;
        var qrImg = results[1] || null;
        return drawTicket(logoImg, qrImg);
    });
}

function downloadDataUrl(dataUrl, filename) {
    var a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
}

// Update Countdown Timer
function updateCountdown() {
    var weddingDate = new Date('December 18, 2026 18:00:00').getTime();
    var now = new Date().getTime();
    var diff = weddingDate - now;

    if (diff <= 0) {
        $('#countdown-hero').html('<p style="color: #2E8B57;">¡El gran día ha llegado!</p>');
        return;
    }

    var days = Math.floor(diff / (1000 * 60 * 60 * 24));
    var hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    var minutes = Math.floor((diff / (1000 * 60)) % 60);
    var seconds = Math.floor((diff / 1000) % 60);

    document.getElementById('d-hero').textContent = String(days).padStart(2, '0');
    document.getElementById('h-hero').textContent = String(hours).padStart(2, '0');
    document.getElementById('m-hero').textContent = String(minutes).padStart(2, '0');
    document.getElementById('s-hero').textContent = String(seconds).padStart(2, '0');
}

// Add to Calendar Function
function agregarAlCalendario(titulo, ubicacion, inicio, fin) {
    var encodedTitulo = encodeURIComponent(titulo);
    var encodedUbicacion = encodeURIComponent(ubicacion);
    
    // Generate an ICS file for Apple Calendar
    var icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Boda Karla & Jose//ES',
        'BEGIN:VEVENT',
        'DTSTART:' + inicio,
        'DTEND:' + fin,
        'SUMMARY:' + titulo,
        'LOCATION:' + ubicacion,
        'DESCRIPTION:' + titulo,
        'STATUS:CONFIRMED',
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');
    
    var icsBlob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    var icsUrl = URL.createObjectURL(icsBlob);

    var opciones = `
        <div id="calendar-modal-overlay" class="gifts-modal active" style="z-index: 9998;">
            <div onclick="event.stopPropagation()" class="gifts-modal-content calendar-modal-content">
                <button onclick="cerrarModalCalendario()" class="gifts-modal-close">
                    <i class="fa fa-times"></i>
                </button>
                <h3 class="gifts-modal-title">
                    <i class="fa fa-calendar"></i> Agregar al Calendario
                </h3>
                <p class="gifts-modal-subtitle">Selecciona tu aplicación de calendario preferida</p>
                
                <div class="gifts-options calendar-options">
                    <!-- Google Calendar option -->
                    <div class="gift-option calendar-option">
                        <div class="gift-option-icon google-color">
                            <i class="fab fa-google"></i>
                        </div>
                        <h4>Google Calendar</h4>
                        <p>Sincroniza con todos tus dispositivos</p>
                        <a href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodedTitulo}&dates=${inicio}/${fin}&location=${encodedUbicacion}"
                           target="_blank"
                           class="btn-gift-option google-btn">
                            <i class="fa fa-external-link"></i> Ir a Google
                        </a>
                    </div>

                    <!-- Apple Calendar option -->
                    <div class="gift-option calendar-option">
                        <div class="gift-option-icon apple-color">
                            <i class="fab fa-apple"></i>
                        </div>
                        <h4>Apple Calendar</h4>
                        <p>Para iPhone, iPad y Mac</p>
                        <a href="${icsUrl}" download="evento-boda.ics"
                           class="btn-gift-option apple-btn">
                            <i class="fa fa-download"></i> Descargar ICS
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;

    var modal = document.createElement('div');
    modal.id = 'calendar-modal-container';
    modal.innerHTML = opciones;
    document.body.appendChild(modal);
    
    // Close when clicking on the overlay
    document.getElementById('calendar-modal-overlay').onclick = function(e) {
        if (e.target.id === 'calendar-modal-overlay') {
            cerrarModalCalendario();
        }
    };
}

function cerrarModalCalendario() {
    var modal = document.getElementById('calendar-modal-container');
    if (modal) {
        modal.remove();
    }
}

// Map Integration (Leaflet + OpenStreetMap)
function initMap() {
    var mapEl = document.getElementById('map-canvas');
    if (!mapEl) {
        console.warn('Map container element not found');
        return;
    }

    if (typeof L === 'undefined') {
        console.warn('Leaflet library not loaded');
        return;
    }

    // Prevent re-initialization if initMap is called more than once
    if (mapEl._leaflet_map) {
        return;
    }

    var ceremonyLatLng = [20.744395, -103.3928862];
    var receptionLatLng = [20.7784148, -103.4550886];
    var centerLatLng = [20.761404, -103.4241881];

    // Track last selected destination for the directions button
    var currentDestinationLatLng = ceremonyLatLng;

    var map = L.map(mapEl, {
        scrollWheelZoom: false,
        zoomControl: true
    }).setView(centerLatLng, 12);

    // Store reference for later resize invalidation
    mapEl._leaflet_map = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    var ceremonyMarker = L.circleMarker(ceremonyLatLng, {
        radius: 10,
        color: '#ffffff',
        weight: 3,
        fillColor: '#d4af37',
        fillOpacity: 1
    }).addTo(map);

    var receptionMarker = L.circleMarker(receptionLatLng, {
        radius: 10,
        color: '#ffffff',
        weight: 3,
        fillColor: '#2E8B57',
        fillOpacity: 1
    }).addTo(map);

    var ceremonyPopupHtml = (
        '<div class="map-popup">' +
            '<strong class="map-popup-title map-popup-title--gold">Ceremonia</strong><br>' +
            '<span class="map-popup-subtitle">Parroquia Nuestra Señora de Altagracia</span><br>' +
            '<span class="map-popup-meta">6:00 PM</span>' +
        '</div>'
    );

    var receptionPopupHtml = (
        '<div class="map-popup">' +
            '<strong class="map-popup-title map-popup-title--green">Recepción</strong><br>' +
            '<span class="map-popup-subtitle">Jardin de Eventos Andira</span><br>' +
            '<span class="map-popup-meta">8:00 PM</span>' +
        '</div>'
    );

    // Disable auto-pan so opening the popup doesn't shove the marker to a corner.
    ceremonyMarker.bindPopup(ceremonyPopupHtml, { closeButton: false, autoPan: false });
    receptionMarker.bindPopup(receptionPopupHtml, { closeButton: false, autoPan: false });

    function focusLocation(latLng, zoom, markerToOpen) {
        // Make repeated focusing deterministic:
        // - Stop any in-progress pan/zoom animation
        // - Invalidate size *without* Leaflet auto-panning
        // - Center without animation (avoids corner drift)
        map.stop();
        window.requestAnimationFrame(function () {
            map.invalidateSize({ animate: false, pan: false });
            map.setView(latLng, zoom, { animate: false });
            if (markerToOpen) {
                markerToOpen.openPopup();
            }
        });
    }

    function focusCeremony() {
        currentDestinationLatLng = ceremonyLatLng;
        focusLocation(ceremonyLatLng, 15, ceremonyMarker);
    }

    function focusReception() {
        currentDestinationLatLng = receptionLatLng;
        focusLocation(receptionLatLng, 15, receptionMarker);
    }

    ceremonyMarker.on('click', function () {
        focusCeremony();
    });

    receptionMarker.on('click', function () {
        focusReception();
    });

    function openGoogleMapsDirectionsTo(destLatLng) {
        var dest = Array.isArray(destLatLng) ? destLatLng : ceremonyLatLng;
        var destinationParam = encodeURIComponent(dest[0] + ',' + dest[1]);

        // Note: Browsers may block opening a *new tab* after the permission prompt (not a direct user gesture),
        // so we navigate in the same tab for reliable behavior.
        var destinationOnlyUrl = 'https://www.google.com/maps/dir/?api=1&destination=' + destinationParam + '&travelmode=driving';

        if (navigator.geolocation && typeof navigator.geolocation.getCurrentPosition === 'function') {
            navigator.geolocation.getCurrentPosition(
                function (pos) {
                    var originParam = encodeURIComponent(pos.coords.latitude + ',' + pos.coords.longitude);
                    var fullUrl = 'https://www.google.com/maps/dir/?api=1&origin=' + originParam + '&destination=' + destinationParam + '&travelmode=driving';
                    window.location.href = fullUrl;
                },
                function () {
                    // If user blocks location, still open Google Maps with destination.
                    window.location.href = destinationOnlyUrl;
                },
                { enableHighAccuracy: false, timeout: 6000, maximumAge: 60000 }
            );
        } else {
            window.location.href = destinationOnlyUrl;
        }
    }

    function invalidateSoon() {
        // Leaflet needs this when the map is shown/overlays change
        setTimeout(function () {
            map.invalidateSize({ animate: false, pan: false });
        }, 50);
    }

    // Keep map aligned on window resize/orientation changes
    window.addEventListener('resize', invalidateSoon);

    // Toggle map content buttons (preserve existing UX)
    $('#btn-show-map-ceremony')
        .off('click.map')
        .on('click.map', function (e) {
            e.preventDefault();
            $('#map-content').toggleClass('toggle-map-content');
            $('#btn-show-content').toggleClass('toggle-map-content');
            $('#btn-directions').toggleClass('toggle-map-content');
            // Wait for layout changes (opacity/visibility) before centering
            setTimeout(function () {
                focusCeremony();
            }, 60);
        });

    $('#btn-show-map-reception')
        .off('click.map')
        .on('click.map', function (e) {
            e.preventDefault();
            $('#map-content').toggleClass('toggle-map-content');
            $('#btn-show-content').toggleClass('toggle-map-content');
            $('#btn-directions').toggleClass('toggle-map-content');
            setTimeout(function () {
                focusReception();
            }, 60);
        });

    $('#btn-show-content')
        .off('click.map')
        .on('click.map', function () {
            $('#map-content').toggleClass('toggle-map-content');
            $('#btn-show-content').toggleClass('toggle-map-content');
            $('#btn-directions').toggleClass('toggle-map-content');
            invalidateSoon();
        });

    $('#btn-directions')
        .off('click.map')
        .on('click.map', function () {
            openGoogleMapsDirectionsTo(currentDestinationLatLng);
        });

    // Initial size fix (in case the section loads while not visible)
    invalidateSoon();
}

// Leaflet is loaded via CDN; initialize once DOM is ready.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMap);
} else {
    initMap();
}

// Smooth Scroll Link Handler
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        var target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

/* ============================================
   MUSIC PLAYER
   ============================================ */

// Playlist - add your MP3 files here
const playlist = [
    {
        title: "How Deep Is Your Love",
        artist: "Bee Gees",
        src: "mp3/How Deep Is Your Love - Bee Gees.mp3"
    },
    {
        title: "Patadas de Ahogado",
        artist: "LATIN MAFIA",
        src: "mp3/Patadas de Ahogado - LATIN MAFIA.mp3"
    },
    {
        title: "Del Altar a la Tumba",
        artist: "José José",
        src: "mp3/Del Altar a la Tumba - José José.mp3"
    },
    {
        title: "Morfina",
        artist: "HUMBE",
        src: "mp3/Morfina - HUMBE.mp3"
    },
    {
        title: "Sólo Tú y Yo",
        artist: "José José",
        src: "mp3/Sólo Tú y Yo - José José.mp3"
    },
    {
        title: "Por Favor",
        artist: "HUMBE",
        src: "mp3/Por Favor - HUMBE.mp3"
    },
];

let currentTrackIndex = 0;

const audioPlayer = document.getElementById('audio-player');
const playPauseBtn = document.getElementById('play-pause-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const trackTitle = document.getElementById('track-title');
const trackArtist = document.getElementById('track-artist');
const progressFill = document.getElementById('progress-fill');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const progressBar = document.querySelector('.progress-bar');

function isAudioPlaying() {
    return !!(audioPlayer && !audioPlayer.paused && !audioPlayer.ended);
}

function syncPlayPauseUI() {
    if (!audioPlayer || !playPauseBtn) return;
    const icon = playPauseBtn.querySelector('i');
    if (!icon) return;

    const playingNow = isAudioPlaying();
    icon.classList.toggle('fa-play', !playingNow);
    icon.classList.toggle('fa-pause', playingNow);
    playPauseBtn.setAttribute('title', playingNow ? 'Pausar' : 'Reproducir');
    playPauseBtn.setAttribute('aria-label', playingNow ? 'Pausar' : 'Reproducir');
}

// Load a track
function loadTrack(index) {
    if (playlist.length === 0) {
        trackTitle.textContent = "Sin canciones";
        trackArtist.textContent = "Agrega archivos MP3 a la carpeta 'mp3'";
        return;
    }
    
    const track = playlist[index];
    audioPlayer.src = track.src;
    trackTitle.textContent = track.title;
    trackArtist.textContent = track.artist;
    
    // Reset progress
    progressFill.style.width = '0%';
    currentTimeEl.textContent = '0:00';
}

// Play/pause toggle
function togglePlayPause() {
    if (playlist.length === 0) return;

    // Don't rely on a separate boolean; use the audio element as source of truth.
    if (!audioPlayer) return;

    if (audioPlayer.paused || audioPlayer.ended) {
        const playPromise = audioPlayer.play();
        if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(function () {
                // If autoplay/user-gesture restrictions block play, keep UI consistent.
                syncPlayPauseUI();
            });
        }
    } else {
        audioPlayer.pause();
    }
}

// Previous track
function previousTrack(autoplay) {
    if (playlist.length === 0) return;
    
    currentTrackIndex--;
    if (currentTrackIndex < 0) {
        currentTrackIndex = playlist.length - 1;
    }
    loadTrack(currentTrackIndex);
    if (autoplay) {
        const playPromise = audioPlayer.play();
        if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(function () { syncPlayPauseUI(); });
        }
    }
}

// Next track
function nextTrack(autoplay) {
    if (playlist.length === 0) return;
    
    currentTrackIndex++;
    if (currentTrackIndex >= playlist.length) {
        currentTrackIndex = 0;
    }
    loadTrack(currentTrackIndex);
    if (autoplay) {
        const playPromise = audioPlayer.play();
        if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(function () { syncPlayPauseUI(); });
        }
    }
}

// Format time
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// Event Listeners
if (audioPlayer) {
    // When metadata is available
    audioPlayer.addEventListener('loadedmetadata', function() {
        durationEl.textContent = formatTime(audioPlayer.duration);
    });

    // Update progress
    audioPlayer.addEventListener('timeupdate', function() {
        if (!isFinite(audioPlayer.duration) || audioPlayer.duration <= 0) return;
        const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        progressFill.style.width = progress + '%';
        currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
    });

    // When the track ends
    audioPlayer.addEventListener('ended', function() {
        // Auto-advance and keep playing when a track ends naturally.
        nextTrack(true);
        syncPlayPauseUI();
    });

    // Keep UI in sync even when audio state changes externally
    audioPlayer.addEventListener('play', syncPlayPauseUI);
    audioPlayer.addEventListener('pause', syncPlayPauseUI);
    audioPlayer.addEventListener('playing', syncPlayPauseUI);
    audioPlayer.addEventListener('emptied', syncPlayPauseUI);

    // Click on the progress bar
    if (progressBar) {
        progressBar.addEventListener('click', function(e) {
            if (playlist.length === 0) return;
            
            const rect = progressBar.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const width = rect.width;
            const percentage = clickX / width;
            audioPlayer.currentTime = percentage * audioPlayer.duration;
        });
    }
}

// Control buttons
if (playPauseBtn) {
    playPauseBtn.addEventListener('click', togglePlayPause);
}

if (prevBtn) {
    prevBtn.addEventListener('click', function () {
        previousTrack(isAudioPlaying());
    });
}

if (nextBtn) {
    nextBtn.addEventListener('click', function () {
        nextTrack(isAudioPlaying());
    });
}

// Load the first track on startup and autoplay
if (playlist.length > 0) {
    loadTrack(currentTrackIndex);
    
    let musicStarted = false;
    let scrollDetected = false;
    
    // Create an invisible overlay and a notification
    const musicOverlay = document.createElement('div');
    musicOverlay.id = 'music-overlay';
    musicOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: transparent;
        z-index: 999999;
        cursor: pointer;
        display: none;
    `;
    
    const musicNotification = document.createElement('div');
    musicNotification.id = 'music-notification';
    musicNotification.innerHTML = `
        <div style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #0F3B2E 0%, #2E8B57 100%);
            color: white;
            padding: 25px 35px;
            border-radius: 20px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.4);
            font-family: 'Karla', sans-serif;
            font-size: 18px;
            z-index: 1000001;
            cursor: pointer;
            animation: fadeInScale 0.5s ease, pulse 2s infinite;
            display: none;
            text-align: center;
            border: 3px solid rgba(255, 255, 255, 0.3);
            max-width: 90%;
        " id="music-notif-content">
            <i class="fa fa-music" style="margin-right: 10px; font-size: 22px;"></i>
            <div style="margin-top: 10px; font-weight: 600; font-size: 20px;">Toca aquí para activar la música</div>
            <div style="margin-top: 8px; font-size: 14px; opacity: 0.9;">🎵 Disfruta de nuestra selección musical</div>
        </div>
        <style>
            @keyframes fadeInScale {
                from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            }
            @keyframes pulse {
                0%, 100% { box-shadow: 0 10px 40px rgba(0,0,0,0.4); }
                50% { box-shadow: 0 10px 40px rgba(212, 175, 55, 0.6); }
            }
            @media (max-width: 480px) {
                #music-notif-content {
                    padding: 30px 25px !important;
                    font-size: 16px !important;
                    border-radius: 16px !important;
                }
                #music-notif-content > div:first-of-type {
                    font-size: 18px !important;
                }
            }
        </style>
    `;
    
    document.body.appendChild(musicOverlay);
    document.body.appendChild(musicNotification);
    
    // Start music
    function startMusic() {
        if (musicStarted) return;
        
        const playPromise = audioPlayer.play();
        
        if (playPromise !== undefined) {
            playPromise.then(function() {
                // Playback started successfully
                musicStarted = true;
                syncPlayPauseUI();
                
                // Hide overlay and notification
                musicOverlay.style.display = 'none';
                document.getElementById('music-notif-content').style.display = 'none';
                
                // Remove event listeners
                window.removeEventListener('scroll', scrollHandler);
                musicOverlay.removeEventListener('click', startMusic);
                musicOverlay.removeEventListener('touchstart', startMusic);
                document.getElementById('music-notif-content').removeEventListener('click', startMusic);
                document.getElementById('music-notif-content').removeEventListener('touchstart', startMusic);
            }).catch(function(error) {
                syncPlayPauseUI();
            });
        }
    }
    
    // Scroll handler - shows the notification
    function scrollHandler() {
        if (musicStarted || scrollDetected) return;
        
        const scrolled = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrolled > 50) {
            scrollDetected = true;
            
            // Show overlay and notification
            musicOverlay.style.display = 'block';
            document.getElementById('music-notif-content').style.display = 'block';
            
            // Make the notification directly clickable
            const notifContent = document.getElementById('music-notif-content');
            notifContent.addEventListener('click', startMusic);
            notifContent.addEventListener('touchstart', startMusic, { passive: true });
            
            // The overlay also captures clicks outside the notification
            musicOverlay.addEventListener('click', startMusic);
            musicOverlay.addEventListener('touchstart', startMusic, { passive: true });
        }
    }
    
    // Scroll event listener
    window.addEventListener('scroll', scrollHandler, { passive: true });
}

// Extra safety: resync button state after returning to the page/tab.
document.addEventListener('visibilitychange', syncPlayPauseUI);
window.addEventListener('pageshow', syncPlayPauseUI);
window.addEventListener('focus', syncPlayPauseUI);
/* ============================================
    PHOTO UPLOAD FUNCTIONALITY - GOOGLE APPS SCRIPT
   ============================================ */

// ⚠️ IMPORTANT: Replace this URL with your Google Apps Script URL
const GALLERY_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwpDRH3XHlD29XuLAjU6N_8BVso02PnYhyIhFCSlysJpQPKZMIhglesHvUGj83sOKI_/exec';

// Show selected file names
const photoFileInput = document.getElementById('photo-file');
const fileInfo = document.getElementById('file-info');

if (photoFileInput && fileInfo) {
    photoFileInput.addEventListener('change', function() {
        const files = this.files;
        if (files.length > 0) {
            if (files.length === 1) {
                fileInfo.textContent = `${files[0].name}`;
            } else {
                fileInfo.textContent = `${files.length} archivos seleccionados`;
            }
            fileInfo.style.color = '#2E8B57';
        } else {
            fileInfo.textContent = 'Ningún archivo seleccionado';
            fileInfo.style.color = '#999';
        }
    });
}

// Handle the photo upload form
const photoUploadForm = document.getElementById('photo-upload-form');

// Strict client-side validation to reduce non-image uploads.
// Note: real validation also happens in Apps Script.
const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const DISALLOWED_EXTENSIONS = new Set(['svg']);

function getFileExtensionLower(name) {
    const parts = String(name || '').split('.');
    if (parts.length < 2) return '';
    return parts.pop().toLowerCase();
}

async function readFirstBytes(file, byteCount) {
    const slice = file.slice(0, byteCount);
    const buffer = await slice.arrayBuffer();
    return new Uint8Array(buffer);
}

function hasJpegMagic(bytes) {
    return bytes.length >= 3 && bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;
}

function hasPngMagic(bytes) {
    return bytes.length >= 8 &&
        bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47 &&
        bytes[4] === 0x0D && bytes[5] === 0x0A && bytes[6] === 0x1A && bytes[7] === 0x0A;
}

function hasGifMagic(bytes) {
    // GIF87a / GIF89a
    return bytes.length >= 6 &&
        bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38 &&
        (bytes[4] === 0x37 || bytes[4] === 0x39) && bytes[5] === 0x61;
}

function hasWebpMagic(bytes) {
    // RIFF .... WEBP
    return bytes.length >= 12 &&
        bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
        bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
}

async function validateImageFile(file) {
    const extension = getFileExtensionLower(file.name);
    if (DISALLOWED_EXTENSIONS.has(extension) || String(file.type || '').toLowerCase() === 'image/svg+xml') {
        return { ok: false, reason: 'No se permiten archivos SVG.' };
    }

    // Some browsers may send an empty type; validate via magic bytes.
    const mime = String(file.type || '').toLowerCase();
    if (mime && !ALLOWED_IMAGE_MIME_TYPES.has(mime)) {
        return { ok: false, reason: 'Formato no permitido. Usa JPG, PNG, WEBP o GIF.' };
    }

    const bytes = await readFirstBytes(file, 16);
    const looksLikeImage = hasJpegMagic(bytes) || hasPngMagic(bytes) || hasGifMagic(bytes) || hasWebpMagic(bytes);
    if (!looksLikeImage) {
        return { ok: false, reason: 'El archivo no parece ser una imagen válida.' };
    }

    return { ok: true };
}

if (photoUploadForm) {
    photoUploadForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const guestName = document.getElementById('guest-name').value.trim();
        const files = photoFileInput.files;
        
        if (!guestName || files.length === 0) {
            alert('Por favor, completa todos los campos');
            return;
        }
        
        // Validate file size (max 5MB per photo)
        for (let file of files) {
            if (file.size > 5 * 1024 * 1024) {
                alert(`La foto "${file.name}" es demasiado grande. Tamaño máximo: 5MB`);
                return;
            }
        }

        // Strict validation (MIME/extension/magic bytes)
        for (let file of files) {
            try {
                const result = await validateImageFile(file);
                if (!result.ok) {
                    alert(`"${file.name}": ${result.reason}`);
                    return;
                }
            } catch (err) {
                console.error('Error validando archivo:', err);
                alert(`No se pudo validar "${file.name}". Intenta con otra imagen.`);
                return;
            }
        }
        
        // Upload photos to Google Apps Script
        uploadPhotosToGoogleDrive(guestName, files);
    });
}

/**
 * Upload photos to Google Drive via Google Apps Script
 */
async function uploadPhotosToGoogleDrive(guestName, files) {
    const uploadBtn = photoUploadForm.querySelector('button[type="submit"]');
    const originalBtnText = uploadBtn.innerHTML;
    
    uploadBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Subiendo...';
    uploadBtn.disabled = true;
    
    let uploadedCount = 0;
    let failedCount = 0;
    
    // Process each file
    for (let file of files) {
        // Extra defense (already validated before submit)
        const ext = getFileExtensionLower(file.name);
        if (ext === 'svg' || String(file.type || '').toLowerCase() === 'image/svg+xml') {
            failedCount++;
            continue;
        }
        
        try {
            // Convert file to base64
            const base64Data = await fileToBase64(file);
            
            // Send to Google Apps Script
            const response = await fetch(GALLERY_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors', // Important for Google Apps Script
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'uploadPhoto',
                    guestName: guestName,
                    photoData: base64Data,
                    fileName: file.name,
                    section: 'invitados'
                })
            });
            
            // Note: with mode: 'no-cors', we cannot read the response
            // Assume it succeeded if there was no error
            uploadedCount++;
            
        } catch (error) {
            console.error(`❌ Error subiendo ${file.name}:`, error);
            failedCount++;
        }
    }
    
    // Restore button
    uploadBtn.innerHTML = originalBtnText;
    uploadBtn.disabled = false;
    
    // Reset form
    photoUploadForm.reset();
    fileInfo.textContent = 'Ningún archivo seleccionado';
    fileInfo.style.color = '#999';
    
    // Show result
    if (uploadedCount > 0) {
        alert(`¡Gracias por compartir tus fotos! 📸\n\n${uploadedCount} foto(s) se enviaron correctamente.\n\nNota: Por seguridad, las fotos se mostrarán en la galería después de ser aprobadas.`);
        
        // Reload gallery after 2 seconds
        setTimeout(() => {
            loadGuestPhotos();
        }, 2000);
    }
    
    if (failedCount > 0) {
        alert(`Algunas fotos no se pudieron subir. Por favor, intenta de nuevo.`);
    }
}

/**
 * Convert file to base64
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

/**
 * Load guest photos from Google Drive and display in the carousel
 */
async function loadGuestPhotos() {
    const carouselTrack = document.getElementById('carousel-track');
    
    if (!carouselTrack) return;
    
    try {
        const response = await fetch(`${GALLERY_SCRIPT_URL}?action=getPhotos&section=invitados`);
        const data = await response.json();
        
        if (data.success && data.photos && data.photos.length > 0) {
            // Remove "no photos" message
            const noPhotosMsg = carouselTrack.querySelector('.no-photos-carousel');
            if (noPhotosMsg) {
                noPhotosMsg.remove();
            }
            
            // Clear existing photos
            carouselTrack.innerHTML = '';
            
            // Add each photo to the carousel
            data.photos.forEach((photo, index) => {
                // Convert URL to a format that works in an <img> tag
                const imageUrl = convertDriveUrl(photo.url);
                
                // Format date
                const photoDate = new Date(photo.timestamp);
                const dateStr = photoDate.toLocaleDateString('es-MX', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                const slideHtml = `
                    <div class="carousel-slide" data-index="${index}">
                        <img src="${imageUrl}" 
                             alt="Foto de ${photo.guestName}" 
                             loading="lazy"
                             onerror="this.onerror=null; this.parentElement.innerHTML='<p style=color:#999>Error al cargar la imagen</p>';">
                        <div class="photo-info">
                            <p class="photo-author">
                                <i class="fa fa-user"></i> ${photo.guestName}
                            </p>
                            <p class="photo-date">
                                <i class="fa fa-clock-o"></i> ${dateStr}
                            </p>
                        </div>
                    </div>
                `;
                carouselTrack.insertAdjacentHTML('beforeend', slideHtml);
            });
            
            // Update counter
            document.getElementById('total-photos').textContent = data.photos.length;
            document.getElementById('carousel-counter').style.display = 'block';
            
            // Show controls if there is more than one photo
            if (data.photos.length > 1) {
                document.getElementById('carousel-prev').style.display = 'flex';
                document.getElementById('carousel-next').style.display = 'flex';
            }
            
            // Initialize carousel
            initializeCarousel(data.photos.length);
        }
    } catch (error) {
        console.error('Error cargando fotos:', error);
    }
}

/**
 * Initialize carousel functionality
 */
let currentSlide = 0;
let totalSlides = 0;

function initializeCarousel(total) {
    totalSlides = total;
    currentSlide = 0;
    updateCarousel();
    
    // Event listeners for the controls
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');
    
    if (prevBtn && nextBtn) {
        prevBtn.onclick = () => {
            if (currentSlide > 0) {
                currentSlide--;
                updateCarousel();
            }
        };
        
        nextBtn.onclick = () => {
            if (currentSlide < totalSlides - 1) {
                currentSlide++;
                updateCarousel();
            }
        };
    }
    
    // Touch gesture support (swipe)
    const carousel = document.getElementById('guest-photos-carousel');
    let touchStartX = 0;
    let touchEndX = 0;
    
    carousel.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });
    
    carousel.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });
    
    function handleSwipe() {
        if (touchEndX < touchStartX - 50 && currentSlide < totalSlides - 1) {
            // Swipe left - next
            currentSlide++;
            updateCarousel();
        }
        if (touchEndX > touchStartX + 50 && currentSlide > 0) {
            // Swipe right - previous
            currentSlide--;
            updateCarousel();
        }
    }
    
    // Keyboard support (arrow keys)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' && currentSlide > 0) {
            currentSlide--;
            updateCarousel();
        } else if (e.key === 'ArrowRight' && currentSlide < totalSlides - 1) {
            currentSlide++;
            updateCarousel();
        }
    });
}

function updateCarousel() {
    const track = document.getElementById('carousel-track');
    const offset = -currentSlide * 100;
    track.style.transform = `translateX(${offset}%)`;
    
    // Actualizar contador
    document.getElementById('current-photo').textContent = currentSlide + 1;
    
    // Actualizar estado de botones
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');
    
    if (prevBtn) {
        prevBtn.style.opacity = currentSlide === 0 ? '0.3' : '1';
        prevBtn.style.cursor = currentSlide === 0 ? 'not-allowed' : 'pointer';
    }
    
    if (nextBtn) {
        nextBtn.style.opacity = currentSlide === totalSlides - 1 ? '0.3' : '1';
        nextBtn.style.cursor = currentSlide === totalSlides - 1 ? 'not-allowed' : 'pointer';
    }
}

/**
 * Convert a Google Drive URL to the correct format for displaying in an <img>
 */
function convertDriveUrl(url) {
    // If it's already in the correct format, return as-is
    if (url.includes('googleusercontent.com')) {
        return url;
    }
    
    // Extract the file ID from different Drive URL formats
    let fileId = null;
    
    // Formato: https://drive.google.com/uc?export=view&id=FILE_ID
    if (url.includes('drive.google.com/uc')) {
        const match = url.match(/[?&]id=([^&]+)/);
        if (match) fileId = match[1];
    }
    
    // Formato: https://drive.google.com/file/d/FILE_ID/view
    if (url.includes('drive.google.com/file/d/')) {
        const match = url.match(/\/file\/d\/([^\/]+)/);
        if (match) fileId = match[1];
    }
    
    // If we found the ID, convert to an <img>-friendly format
    if (fileId) {
        return `https://lh3.googleusercontent.com/d/${fileId}=s4000?authuser=0`;
    }
    
    // If we couldn't convert it, return the original URL
    return url;
}

// Load photos when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Wait 1 second before loading photos
    setTimeout(() => {
        loadGuestPhotos();
    }, 1000);
});

/* ============================================
    GIFT REGISTRY MODAL
   ============================================ */

function openGiftsModal() {
    const modal = document.getElementById('gifts-modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent body scroll
    }
}

function closeGiftsModal() {
    const modal = document.getElementById('gifts-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scroll
    }
}

function closeRsvpModal() {
    const modal = document.getElementById('rsvp-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scroll
    }
}

// Close modal when clicking outside the content
document.addEventListener('DOMContentLoaded', function() {
    const giftsModal = document.getElementById('gifts-modal');
    if (giftsModal) {
        giftsModal.addEventListener('click', function(e) {
            if (e.target === giftsModal) {
                closeGiftsModal();
            }
        });
    }
    
    const rsvpModal = document.getElementById('rsvp-modal');
    if (rsvpModal) {
        rsvpModal.addEventListener('click', function(e) {
            if (e.target === rsvpModal) {
                closeRsvpModal();
            }
        });
    }
    
    // Close modals with the Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeGiftsModal();
            closeRsvpModal();
        }
    });
});