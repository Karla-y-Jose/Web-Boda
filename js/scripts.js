/* ============================================
   WEDDING WEBSITE - MAIN SCRIPTS
   ============================================ */

$(document).ready(function () {
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
            const scroll = $(window).scrollTop();

            if (scroll >= 20) {
                $('.navigation').addClass('fixed');
                // add class to header to hide the pseudo-element keyline
                $('header').addClass('scrolled').css({
                    "padding": "35px 0"
                });
            } else {
                $('.navigation').removeClass('fixed');
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
    const RSVP_ENDPOINT = 'https://script.google.com/macros/s/AKfycbx_6CBQaLmuFTzuG9_gi2nGU7nDN0YieWlcgHS92TevwYralGueUGUq3Keuoh6gF29DMA/exec';

    // Expose for global helpers (ticket QR generation lives outside document.ready)
    window.__RSVP_ENDPOINT = RSVP_ENDPOINT;

    // RSVP security state (email + pre-shared group code)
    window.__rsvpAuthToken = '';
    window.__rsvpVerifiedEmail = '';

    let currentGuests = [];

    // Search guest by name
    $('#rsvp-search-form').on('submit', function (e) {
        e.preventDefault();
        const searchName = $('#rsvp-search-name').val().trim();
        const email = String($('#rsvp-search-email').val() || '').trim();
        const groupCode = String($('#rsvp-group-code').val() || '').trim();
        const $btn = $(this).find('button[type="submit"]');

        if (!searchName) {
            $('#alert-wrapper').html(alert_markup('warning', 'Por favor ingresa tu nombre.'));
            return;
        }

        if (!email) {
            $('#alert-wrapper').html(alert_markup('warning', 'Por favor ingresa tu correo.'));
            return;
        }

        if (!groupCode) {
            $('#alert-wrapper').html(alert_markup('warning', 'Por favor ingresa tu cÃ³digo de grupo.'));
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
            .done(function (response) {
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
            .fail(function (err) {
                console.error('Search error:', err);
                $('#alert-wrapper').html(alert_markup('danger', '<strong>Error de conexiÃ³n.</strong> Por favor intenta mÃ¡s tarde.'));
            })
            .always(function () {
                $btn.prop('disabled', false);
            });
    });

    // Show guest list
    function displayGuestList(groupName, guests) {
        $('#alert-wrapper').html('');
        $('#rsvp-search-container').hide();
        $('#rsvp-guest-list').show();
        $('#group-name').text(groupName);

        let guestsHtml = '';
        guests.forEach(function (guest, index) {
            const currentState = guest.estado || 'Pendiente';
            guestsHtml += `
                <div class="guest-item" data-row-index="${guest.rowIndex}">
                    <div class="guest-name">
                        <span class="material-symbols-outlined">person</span>
                        ${guest.nombre} ${guest.apellido}
                    </div>
                    <div class="attendance-options">
                        <div class="attendance-option confirmed">
                            <label>
                                <input type="radio" name="guest_${index}" value="Confirmado" ${currentState === 'Confirmado' ? 'checked' : ''}>
                                <span><span class="material-symbols-outlined">check_circle</span> Confirmar</span>
                            </label>
                        </div>
                        <div class="attendance-option not-attending">
                            <label>
                                <input type="radio" name="guest_${index}" value="No Asiste" ${currentState === 'No Asiste' ? 'checked' : ''}>
                                <span><span class="material-symbols-outlined">cancel</span> No Asistirá</span>
                            </label>
                        </div>
                        <div class="attendance-option pending">
                            <label>
                                <input type="radio" name="guest_${index}" value="Pendiente" ${currentState === 'Pendiente' ? 'checked' : ''}>
                                <span><span class="material-symbols-outlined">schedule</span> Pendiente</span>
                            </label>
                        </div>
                    </div>
                </div>
            `;
        });

        $('#guests-container').html(guestsHtml);
    }

    // Confirm attendance
    $('#confirm-attendance-btn').on('click', function () {
        if (!window.__rsvpAuthToken) {
            $('#confirm-alert-wrapper').html(alert_markup('danger', '<strong>Error:</strong> Primero realiza la bÃºsqueda con tu cÃ³digo para continuar.'));
            return;
        }

        const $btn = $(this);
        const updates = [];
        const confirmedGuestNames = [];
        const groupName = String($('#group-name').text() || '').trim();

        $('.guest-item').each(function (index) {
            const rowIndex = $(this).data('row-index');
            const selectedState = $(this).find('input[type="radio"]:checked').val();

            if (selectedState === 'Confirmado' && Array.isArray(currentGuests) && currentGuests[index]) {
                const g = currentGuests[index];
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
        const updatesJson = encodeURIComponent(JSON.stringify(updates));

        $.ajax({
            url: RSVP_ENDPOINT + '?action=updateAttendance&updates=' + updatesJson + '&token=' + encodeURIComponent(window.__rsvpAuthToken),
            method: 'GET',
            dataType: 'json'
        })
            .done(function (response) {
                if (response.result === 'success') {
                    // Attach server-issued ticket code (verifiable against the sheet)
                    if (response.ticketId && window.__rsvpTicketPayload) {
                        window.__rsvpTicketPayload.ticketId = String(response.ticketId || '').trim();
                    }
                    $('#confirm-alert-wrapper').html(alert_markup('success', '<strong>Â¡Listo!</strong> ' + response.message));

                    // Show confirmation modal
                    setTimeout(function () {
                        $('#rsvp-modal').addClass('active');

                        // Add calendar buttons with the same behavior as the events section
                        const tickets = (window.__rsvpTicketPayload && Array.isArray(window.__rsvpTicketPayload.confirmedGuests))
                            ? window.__rsvpTicketPayload.confirmedGuests
                            : [];
                        let ticketButtonHtml = '';
                        if (tickets.length > 0) {
                            const label = tickets.length === 1 ? 'Descargar boleto' : 'Descargar boletos';
                            ticketButtonHtml = `
                            <button type="button"
                                    onclick="downloadRsvpTickets()"
                                    class="calendar-btn-modal">
                                <i class="fa fa-ticket" style="font-size:14px;"></i> ${label}
                            </button>
                        `;
                        }

                        const calendarButtons = `
                        <div style="display: flex; flex-direction: row; gap: 0.75rem; margin-top: 20px;">
                            <button onclick="agregarAlCalendario('Boda Karla &amp; Jose', 'Ceremonia: Parroquia Nuestra Señora de Altagracia, Zapopan, Jal. | Recepción: Jardin de Eventos Andira, Nuevo México, Jal.', '20261218T180000', '20261219T020000')" 
                                    class="calendar-btn-modal">
                                <i class="fab fa-google" style="font-size:14px;"></i> Añadir al Calendario
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
            .fail(function (err) {
                console.error('Update error:', err);
                $('#confirm-alert-wrapper').html(alert_markup('danger', '<strong>Error de conexión.</strong> Por favor intenta más tarde.'));
            })
            .always(function () {
                $btn.prop('disabled', false);
            });
    });

    // Back to search
    $('#back-to-search-btn').on('click', function () {
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
    const payload = window.__rsvpTicketPayload || null;
    const guests = payload && Array.isArray(payload.confirmedGuests) ? payload.confirmedGuests : [];
    const groupName = payload && typeof payload.groupName === 'string' ? payload.groupName : '';
    const ticketId = payload && typeof payload.ticketId === 'string' ? payload.ticketId : '';

    if (!guests.length) {
        alert('No hay boletos disponibles para descargar.');
        return;
    }

    const safeGroup = String(groupName || 'grupo')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '')
        .toLowerCase();
    const filename = guests.length === 1
        ? ('boleto-' + safeGroup + '.png')
        : ('boletos-' + safeGroup + '.png');

    // Canvas drawing needs assets loaded, so ticket generation is async.
    let qrPromise = Promise.resolve('');
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
    const endpoint = window.__RSVP_ENDPOINT || '';
    if (!endpoint || !window.__rsvpAuthToken) return Promise.reject(new Error('Missing RSVP auth token'));

    const payload = {
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
    const endpoint = window.__RSVP_ENDPOINT || '';
    if (!endpoint) return '';
    return endpoint + '?action=verifyTicket&ticketId=' + encodeURIComponent(String(ticketId || '').trim());
}

function generateQrDataUrlLocal(text, sizePx) {
    if (typeof qrcode !== 'function') {
        throw new Error('QR library not loaded');
    }
    const size = Number(sizePx) > 0 ? Number(sizePx) : 240;
    const qr = qrcode(0, 'M');
    qr.addData(String(text || ''));
    qr.make();

    const count = qr.getModuleCount();
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#000000';

    const tileW = size / count;
    const tileH = size / count;

    for (let row = 0; row < count; row++) {
        for (let col = 0; col < count; col++) {
            if (!qr.isDark(row, col)) continue;
            const x = Math.round(col * tileW);
            const y = Math.round(row * tileH);
            const w = Math.ceil(tileW);
            const h = Math.ceil(tileH);
            ctx.fillRect(x, y, w, h);
        }
    }

    return canvas.toDataURL('image/png');
}

function getQrDataUrlForTicket(ticketId) {
    // Prefer server-side QR if available; fall back to local QR generation.
    return fetchTicketQrDataUrl(ticketId)
        .catch(function () {
            const verifyUrl = buildVerifyTicketUrl(ticketId);
            if (!verifyUrl) return '';
            return generateQrDataUrlLocal(verifyUrl, 240);
        });
}

function fetchTicketQrDataUrl(ticketId) {
    const endpoint = window.__RSVP_ENDPOINT || '';
    if (!endpoint) return Promise.reject(new Error('RSVP endpoint not available'));

    const url = endpoint + '?action=getTicketQr&ticketId=' + encodeURIComponent(String(ticketId || '').trim());

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
        const img = new Image();
        // Do not force crossOrigin here; it can break loads in some local hosting setups.
        img.onload = function () { resolve(img); };
        img.onerror = function () { reject(new Error('Failed to load image: ' + src)); };
        img.src = resolveAssetUrl(src);
    });
}

function loadImageForCanvasUntainted(src) {
    const resolved = resolveAssetUrl(src);

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
                const objUrl = URL.createObjectURL(blob);
                return loadImageForCanvas(objUrl)
                    .then(function (img) {
                        try { URL.revokeObjectURL(objUrl); } catch (_e) { }
                        return img;
                    })
                    .catch(function (e) {
                        try { URL.revokeObjectURL(objUrl); } catch (_e) { }
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
    const el = document.querySelector('img[src*="logo2.png"]');
    if (el && el.src) return el.src;
    return 'img/logo2.png';
}

function drawImageContain(ctx, img, x, y, w, h) {
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    if (!iw || !ih) return;
    const scale = Math.min(w / iw, h / ih);
    const dw = Math.round(iw * scale);
    const dh = Math.round(ih * scale);
    const dx = Math.round(x + (w - dw) / 2);
    const dy = Math.round(y + (h - dh) / 2);
    ctx.drawImage(img, dx, dy, dw, dh);
}

function generateRsvpTicketPng(opts) {
    const groupName = (opts && opts.groupName) ? String(opts.groupName) : '';
    const guests = (opts && Array.isArray(opts.guests)) ? opts.guests.map(String).filter(Boolean) : [];
    const ticketId = (opts && opts.ticketId) ? String(opts.ticketId).trim() : '';
    const qrDataUrl = (opts && opts.qrDataUrl) ? String(opts.qrDataUrl) : '';

    const canvas = document.createElement('canvas');
    canvas.width = 1400;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');

    // Palette matches existing site colors.
    const greenDark = '#0F3B2E';
    const green = '#2E8B57';
    const gold = '#d4af37';
    const grayText = '#4a4a4a';

    function drawTicket(logoImg, qrImg) {
        function drawBackgroundAndWatermark() {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = greenDark;
            ctx.fillRect(0, 0, canvas.width, 140);
            ctx.fillStyle = gold;
            ctx.fillRect(0, 138, canvas.width, 6);
            if (logoImg) {
                ctx.save();
                ctx.globalAlpha = 0.30;
                ctx.globalCompositeOperation = 'multiply';
                if ('filter' in ctx) ctx.filter = 'grayscale(1) contrast(1.25) brightness(0.75)';
                drawImageContain(ctx, logoImg, 320, 190, 760, 500);
                if ('filter' in ctx) ctx.filter = 'none';
                ctx.restore();
            }
        }

        function drawTextAndQRCode() {
            ctx.fillStyle = '#ffffff';
            ctx.font = "700 54px 'Crimson Pro', serif";
            ctx.textBaseline = 'alphabetic';
            ctx.fillText('BOLETO', 70, 92);
            ctx.font = '500 30px Manrope, Arial, sans-serif';
            ctx.fillText('Boda de Karla & Jose', 70, 125);

            ctx.fillStyle = grayText;
            ctx.font = '600 30px Manrope, Arial, sans-serif';
            ctx.fillText('ConfirmaciÃ³n de asistencia', 70, 210);

            ctx.fillStyle = green;
            ctx.font = '600 26px Manrope, Arial, sans-serif';
            ctx.fillText('Fecha:', 70, 265);
            ctx.fillStyle = grayText;
            ctx.font = '400 26px Manrope, Arial, sans-serif';
            ctx.fillText('18 de diciembre, 2026', 155, 265);

            ctx.fillStyle = green;
            ctx.font = '600 26px Manrope, Arial, sans-serif';
            ctx.fillText('Grupo:', 70, 310);
            ctx.fillStyle = grayText;
            ctx.font = '400 26px Manrope, Arial, sans-serif';
            ctx.fillText(groupName || 'â€”', 160, 310);

            ctx.fillStyle = green;
            ctx.font = '600 26px Manrope, Arial, sans-serif';
            ctx.fillText('Invitados confirmados:', 70, 370);

            ctx.fillStyle = grayText;
            ctx.font = '400 26px Manrope, Arial, sans-serif';
            const startY = 415;
            const lineHeight = 34;
            const maxLines = 8;
            for (let i = 0; i < Math.min(guests.length, maxLines); i++) {
                ctx.fillText('â€¢ ' + guests[i], 90, startY + (i * lineHeight));
            }
            if (guests.length > maxLines) {
                ctx.fillStyle = '#777';
                ctx.fillText('â€¦y ' + (guests.length - maxLines) + ' mÃ¡s', 90, startY + (maxLines * lineHeight));
            }

            ctx.fillStyle = '#777';
            ctx.font = '400 22px Manrope, Arial, sans-serif';
            ctx.fillText('Presenta este boleto el dÃ­a del evento.', 70, 730);

            if (ticketId) {
                ctx.fillStyle = '#777';
                ctx.font = '600 22px Manrope, Arial, sans-serif';
                ctx.fillText('CÃ³digo: ' + ticketId, 70, 765);
            }

            if (ticketId && qrImg) {
                const qrSize = 220;
                const qrX = canvas.width - (qrSize + 80);
                const qrY = canvas.height - (qrSize + 110);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);
                drawImageContain(ctx, qrImg, qrX, qrY, qrSize, qrSize);
                ctx.fillStyle = '#777';
                ctx.font = '400 18px Manrope, Arial, sans-serif';
                ctx.fillText('Escanea para validar', qrX, qrY + qrSize + 28);
            }

            ctx.strokeStyle = 'rgba(212, 175, 55, 0.55)';
            ctx.lineWidth = 6;
            ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);
        }

        drawBackgroundAndWatermark();
        drawTextAndQRCode();

        try {
            return canvas.toDataURL('image/png');
        } catch (e) {
            if (String(e && e.name) === 'SecurityError') {
                console.warn('Ticket canvas was tainted; exporting without images.');
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.globalAlpha = 1;
                ctx.globalCompositeOperation = 'source-over';
                if ('filter' in ctx) ctx.filter = 'none';

                logoImg = null;
                qrImg = null;
                drawBackgroundAndWatermark();
                drawTextAndQRCode();

                return canvas.toDataURL('image/png');
            }
            throw e;
        }
    }

    // Use the resolved DOM URL first to avoid path issues.
    const logoPromise = loadImageForCanvasUntainted(getTicketLogoUrl())
        .catch(function () { return loadImageForCanvasUntainted('img/logo2.png'); })
        .catch(function () { return loadImageForCanvasUntainted('./img/logo2.png'); })
        .catch(function () { return null; });
    const qrPromise = qrDataUrl ? loadImageForCanvasUntainted(qrDataUrl).catch(function () { return null; }) : Promise.resolve(null);

    return Promise.all([logoPromise, qrPromise]).then(function (results) {
        const logoImg = results[0] || null;
        const qrImg = results[1] || null;
        return drawTicket(logoImg, qrImg);
    });
}

function downloadDataUrl(dataUrl, filename) {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
}

// Update Countdown Timer
function updateCountdown() {
    const weddingDate = new Date('December 18, 2026 18:00:00').getTime();
    const now = new Date().getTime();
    const diff = weddingDate - now;

    if (diff <= 0) {
        $('#countdown-hero').html('<p style="color: #2E8B57;">Â¡El gran dÃ­a ha llegado!</p>');
        return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    document.getElementById('d-hero').textContent = String(days).padStart(2, '0');
    document.getElementById('h-hero').textContent = String(hours).padStart(2, '0');
    document.getElementById('m-hero').textContent = String(minutes).padStart(2, '0');
    document.getElementById('s-hero').textContent = String(seconds).padStart(2, '0');
}

// Add to Calendar Function
function agregarAlCalendario(titulo, ubicacion, inicio, fin) {
    const encodedTitulo = encodeURIComponent(titulo);
    const encodedUbicacion = encodeURIComponent(ubicacion);

    // Generate an ICS file for Apple Calendar
    const icsContent = [
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

    const icsBlob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const icsUrl = URL.createObjectURL(icsBlob);

    const opciones = `
        <div id="calendar-modal-overlay" class="gifts-modal active" style="z-index: 9998;">
            <div onclick="event.stopPropagation()" class="gifts-modal-content calendar-modal-content">
                <button onclick="cerrarModalCalendario()" class="gifts-modal-close calendar-modal-close">
                    <i class="fa fa-times"></i>
                </button>
                <span class="registry-eyebrow" style="display:block; text-align:center;">Añadir al Calendario</span>
                <h3 class="calendar-modal-heading">Elige tu aplicación</h3>
                <p class="calendar-modal-sub">Selecciona tu app de calendario preferida</p>

                <div class="calendar-grid">

                    <a href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodedTitulo}&dates=${inicio}/${fin}&location=${encodedUbicacion}"
                       target="_blank" rel="noopener noreferrer" class="registry-card">
                        <div class="registry-card-icon">
                            <i class="fab fa-google" aria-hidden="true"></i>
                        </div>
                        <div class="registry-card-body">
                            <span class="registry-card-name">Google Calendar</span>
                            <span class="registry-card-sub">Sincroniza con todos tus dispositivos</span>
                        </div>
                        <span class="registry-card-cta">
                            Ir a Google
                            <svg class="registry-card-arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M3 8h10M9 4l4 4-4 4"/>
                            </svg>
                        </span>
                    </a>

                    <a href="${icsUrl}" download="evento-boda.ics" class="registry-card">
                        <div class="registry-card-icon">
                            <i class="fab fa-apple" aria-hidden="true"></i>
                        </div>
                        <div class="registry-card-body">
                            <span class="registry-card-name">Apple Calendar</span>
                            <span class="registry-card-sub">Para iPhone, iPad y Mac</span>
                        </div>
                        <span class="registry-card-cta">
                            Descargar ICS
                            <svg class="registry-card-arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M3 8h10M9 4l4 4-4 4"/>
                            </svg>
                        </span>
                    </a>

                </div>
            </div>
        </div>
    `;

    const modal = document.createElement('div');
    modal.id = 'calendar-modal-container';
    modal.innerHTML = opciones;
    document.body.appendChild(modal);

    // Close when clicking on the overlay
    document.getElementById('calendar-modal-overlay').onclick = function (e) {
        if (e.target.id === 'calendar-modal-overlay') {
            cerrarModalCalendario();
        }
    };
}

function cerrarModalCalendario() {
    const modal = document.getElementById('calendar-modal-container');
    if (modal) {
        modal.remove();
    }
}

// Map Widget â€“ Tab Switching (Google Maps Embeds)
(function () {
    const tabs = document.querySelectorAll('.map-tab');
    const allFrames = document.querySelectorAll('.map-frame-wrap iframe');
    const barLabel = document.getElementById('bar-label');
    const barSublabel = document.getElementById('bar-sublabel');
    const barBtn = document.getElementById('bar-btn');
    const barIcon = document.getElementById('bar-icon');

    if (!tabs.length) return;

    tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            // Activate tab
            tabs.forEach(function (t) { t.classList.remove('active'); });
            tab.classList.add('active');

            // Show correct iframe
            allFrames.forEach(function (f) {
                f.classList.toggle('visible', f.id === tab.dataset.target);
            });

            // Update bottom bar
            if (barLabel) barLabel.textContent = tab.dataset.label;
            if (barSublabel) barSublabel.textContent = tab.dataset.sublabel;
            if (barBtn) {
                barBtn.textContent = tab.dataset.btnText;
                barBtn.href = tab.dataset.btnHref;
                barBtn.className = 'map-btn-link';
            }
            if (barIcon) barIcon.className = 'map-icon ' + tab.dataset.iconClass;
        });
    });
}());


// Activate a specific map tab programmatically (called from event card buttons)
function activarMapTab(targetId) {
    const tab = document.querySelector('.map-tab[data-target="' + targetId + '"]');
    if (tab) tab.click();
}

// Smooth Scroll Link Handler
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

/* ============================================
   GALLERY LIGHTBOX
   ============================================ */
(function () {
    // Collect all gallery item sources in DOM order
    function getGalleryImages() {
        return Array.from(document.querySelectorAll('.gallery-item[data-src]'))
            .map(btn => btn.dataset.src);
    }

    // Build lightbox DOM once
    const lb = document.createElement('div');
    lb.id = 'gallery-lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Visor de imÃ¡genes');
    lb.innerHTML = `
        <button class="lb-close" aria-label="Cerrar"><span class="material-symbols-outlined">close</span></button>
        <button class="lb-prev" aria-label="Anterior"><span class="material-symbols-outlined">chevron_left</span></button>
        <button class="lb-next" aria-label="Siguiente"><span class="material-symbols-outlined">chevron_right</span></button>
        <div class="lb-img-wrap"><img class="lb-img" src="" alt="Imagen galerÃ­a"></div>
        <div class="lb-counter"></div>
    `;
    document.body.appendChild(lb);

    const lbImg = lb.querySelector('.lb-img');
    const lbCounter = lb.querySelector('.lb-counter');
    let lbImages = [];
    let lbIndex = 0;
    let lbTouchStartX = 0;

    function lbOpen(index) {
        lbImages = getGalleryImages();
        lbIndex = index;
        lbShow();
        lb.classList.add('active');
        document.body.style.overflow = 'hidden';
        lb.querySelector('.lb-close').focus();
    }

    function lbClose() {
        lb.classList.remove('active');
        document.body.style.overflow = '';
        lbImg.src = '';
    }

    function lbShow() {
        lbImg.src = lbImages[lbIndex];
        lbCounter.textContent = `${lbIndex + 1} / ${lbImages.length}`;
        lb.querySelector('.lb-prev').style.display = lbImages.length > 1 ? '' : 'none';
        lb.querySelector('.lb-next').style.display = lbImages.length > 1 ? '' : 'none';
    }

    function lbPrev() { lbIndex = (lbIndex - 1 + lbImages.length) % lbImages.length; lbShow(); }
    function lbNext() { lbIndex = (lbIndex + 1) % lbImages.length; lbShow(); }

    // Delegate clicks on gallery buttons
    document.addEventListener('click', function (e) {
        const btn = e.target.closest('.gallery-item[data-src]');
        if (btn) {
            const srcs = getGalleryImages();
            const idx = srcs.indexOf(btn.dataset.src);
            lbOpen(idx >= 0 ? idx : 0);
        }
    });

    lb.querySelector('.lb-close').addEventListener('click', lbClose);
    lb.querySelector('.lb-prev').addEventListener('click', lbPrev);
    lb.querySelector('.lb-next').addEventListener('click', lbNext);

    // Close on backdrop click
    lb.querySelector('.lb-img-wrap').addEventListener('click', function (e) {
        if (e.target === this) lbClose();
    });

    // Keyboard: Escape closes, arrows navigate
    document.addEventListener('keydown', function (e) {
        if (!lb.classList.contains('active')) return;
        if (e.key === 'Escape') lbClose();
        if (e.key === 'ArrowLeft') lbPrev();
        if (e.key === 'ArrowRight') lbNext();
    });

    // Touch swipe
    lb.addEventListener('touchstart', function (e) { lbTouchStartX = e.changedTouches[0].screenX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
        const dx = e.changedTouches[0].screenX - lbTouchStartX;
        if (dx < -50) lbNext();
        if (dx > 50) lbPrev();
    });
}());

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
const progressBar = document.querySelector('#music-player-bar .mpb-progress-track');

function isAudioPlaying() {
    return !!(audioPlayer && !audioPlayer.paused && !audioPlayer.ended);
}

function syncPlayPauseUI() {
    if (!audioPlayer || !playPauseBtn) return;
    const icon = playPauseBtn.querySelector('.material-symbols-outlined');
    if (!icon) return;

    const playingNow = isAudioPlaying();
    icon.textContent = playingNow ? 'pause_circle' : 'play_circle';
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
    audioPlayer.addEventListener('loadedmetadata', function () {
        durationEl.textContent = formatTime(audioPlayer.duration);
    });

    // Update progress
    audioPlayer.addEventListener('timeupdate', function () {
        if (!isFinite(audioPlayer.duration) || audioPlayer.duration <= 0) return;
        const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        progressFill.style.width = progress + '%';
        currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
    });

    // When the track ends
    audioPlayer.addEventListener('ended', function () {
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
        progressBar.addEventListener('click', function (e) {
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

// Load the first track on startup (music will auto-play when the envelope opens)
if (playlist.length > 0) {
    loadTrack(currentTrackIndex);
    // Set initial volume
    audioPlayer.volume = 0.8;
}

// Called from openInvitation() after the envelope finishes fading
function startMusicAfterEnvelope() {
    if (!audioPlayer || playlist.length === 0) return;

    const playPromise = audioPlayer.play();
    if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(function () {
            // Autoplay blocked by browser â€” user can press play manually
            syncPlayPauseUI();
        });
    }
    syncPlayPauseUI();
}

// ========== Volume Control ==========
const volumeSlider = document.getElementById('volume-slider');
const volumeBtn = document.getElementById('volume-btn');
let lastVolume = 0.8; // remember volume before muting

function updateVolumeIcon() {
    if (!volumeBtn) return;
    const icon = document.getElementById('vol-icon');
    if (!icon) return;

    const vol = audioPlayer ? audioPlayer.volume : 1;
    if (vol === 0) {
        icon.textContent = 'volume_off';
        volumeBtn.setAttribute('title', 'Activar sonido');
    } else if (vol < 0.5) {
        icon.textContent = 'volume_down';
        volumeBtn.setAttribute('title', 'Silenciar');
    } else {
        icon.textContent = 'volume_up';
        volumeBtn.setAttribute('title', 'Silenciar');
    }
}

if (volumeSlider && audioPlayer) {
    volumeSlider.addEventListener('input', function () {
        const vol = parseInt(this.value, 10) / 100;
        audioPlayer.volume = vol;
        lastVolume = vol > 0 ? vol : lastVolume;
        updateVolumeIcon();
    });
}

if (volumeBtn && audioPlayer) {
    volumeBtn.addEventListener('click', function () {
        if (audioPlayer.volume > 0) {
            lastVolume = audioPlayer.volume;
            audioPlayer.volume = 0;
            if (volumeSlider) volumeSlider.value = 0;
        } else {
            audioPlayer.volume = lastVolume || 0.8;
            if (volumeSlider) volumeSlider.value = Math.round(audioPlayer.volume * 100);
        }
        updateVolumeIcon();
    });
}

// Sync slider if volume changes externally
if (audioPlayer) {
    audioPlayer.addEventListener('volumechange', function () {
        if (volumeSlider) {
            volumeSlider.value = Math.round(audioPlayer.volume * 100);
        }
        updateVolumeIcon();
    });
}

// Extra safety: resync button state after returning to the page/tab.
document.addEventListener('visibilitychange', syncPlayPauseUI);
window.addEventListener('pageshow', syncPlayPauseUI);
window.addEventListener('focus', syncPlayPauseUI);

// Fade-in the music bar on scroll
(function () {
    var bar = document.getElementById('music-player-bar');
    if (!bar) return;
    var shown = false;
    function checkScroll() {
        if (!shown && window.scrollY > 80) {
            bar.classList.add('mpb-visible');
            shown = true;
            window.removeEventListener('scroll', checkScroll);
        }
    }
    window.addEventListener('scroll', checkScroll, { passive: true });
}());
/* ============================================
    PHOTO UPLOAD FUNCTIONALITY - GOOGLE APPS SCRIPT
   ============================================ */

const GALLERY_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwwvd5pnEPMmxvC9Tk6D0VWf03JJTI2W4rTwUz4x4AsP5a5qMAvysuxg2WJShrJngnU/exec';

// Show selected file names
const photoFileInput = document.getElementById('photo-file');
const fileInfo = document.getElementById('file-info');

if (photoFileInput && fileInfo) {
    photoFileInput.addEventListener('change', function () {
        const files = this.files;
        if (files.length > 0) {
            if (files.length === 1) {
                fileInfo.textContent = `${files[0].name}`;
            } else {
                fileInfo.textContent = `${files.length} archivos seleccionados`;
            }
            fileInfo.style.color = '#2E8B57';
        } else {
            fileInfo.textContent = 'NingÃºn archivo seleccionado';
            fileInfo.style.color = '#999';
        }
    });
}

// Handle the photo upload form
const photoUploadForm = document.getElementById('photo-upload-form');
const galleryGroupCodeInput = document.getElementById('gallery-group-code');

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
        return { ok: false, reason: 'El archivo no parece ser una imagen vÃ¡lida.' };
    }

    return { ok: true };
}

if (photoUploadForm) {
    photoUploadForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const guestName = document.getElementById('guest-name').value.trim();
        const groupCode = galleryGroupCodeInput ? String(galleryGroupCodeInput.value || '').trim() : '';
        const files = photoFileInput.files;

        if (!guestName || !groupCode || files.length === 0) {
            alert('Por favor, completa todos los campos');
            return;
        }

        // Validate file size (max 5MB per photo)
        for (let file of files) {
            if (file.size > 5 * 1024 * 1024) {
                alert(`La foto "${file.name}" es demasiado grande. TamaÃ±o mÃ¡ximo: 5MB`);
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
        try {
            localStorage.setItem('galleryGroupCode', groupCode);
        } catch (_e) {
            // ignore
        }
        uploadPhotosToGoogleDrive(guestName, groupCode, files);
    });
}

/**
 * Upload photos to Google Drive via Google Apps Script
 */
async function uploadPhotosToGoogleDrive(guestName, groupCode, files) {
    const uploadBtn = photoUploadForm.querySelector('button[type="submit"]');
    const originalBtnText = uploadBtn.innerHTML;

    uploadBtn.innerHTML = '<span class="material-symbols-outlined rotating">progress_activity</span> Subiendo...';
    uploadBtn.disabled = true;

    let uploadedCount = 0;
    let failedCount = 0;
    const failureMessages = [];

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
                headers: {
                    // Use a simple request to avoid CORS preflight.
                    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
                },
                body: new URLSearchParams({
                    action: 'uploadPhoto',
                    guestName: guestName,
                    groupCode: String(groupCode || ''),
                    photoData: base64Data,
                    fileName: file.name,
                    section: 'invitados'
                }),
                redirect: 'follow',
                cache: 'no-store'
            });

            let payload = null;
            try {
                payload = await response.json();
            } catch (_e) {
                // If the response isn't JSON (or CORS blocks reading), treat as failure.
            }

            if (!response.ok) {
                const msg = (payload && payload.message) ? payload.message : `HTTP ${response.status}`;
                throw new Error(msg);
            }
            if (!payload || payload.success !== true) {
                const msg = (payload && payload.message) ? payload.message : 'Respuesta invÃ¡lida del servidor';
                throw new Error(msg);
            }

            uploadedCount++;

        } catch (error) {
            console.error(`âŒ Error subiendo ${file.name}:`, error);
            failedCount++;
            failureMessages.push(`${file.name}: ${error && error.message ? error.message : 'Error desconocido'}`);
        }
    }

    // Restore button
    uploadBtn.innerHTML = originalBtnText;
    uploadBtn.disabled = false;

    // Reset form
    photoUploadForm.reset();
    fileInfo.textContent = 'NingÃºn archivo seleccionado';
    fileInfo.style.color = '#999';

    // Show result
    if (uploadedCount > 0) {
        alert(`Â¡Gracias por compartir tus fotos! ðŸ“¸\n\n${uploadedCount} foto(s) se enviaron correctamente.\n\nNota: Por seguridad, las fotos se mostrarÃ¡n en la galerÃ­a despuÃ©s de ser aprobadas.`);

        // Reload gallery after 2 seconds
        setTimeout(() => {
            loadGuestPhotos();
        }, 2000);
    }

    if (failedCount > 0) {
        const details = failureMessages.length ? `\n\nDetalle:\n- ${failureMessages.join('\n- ')}` : '';
        alert(`Algunas fotos no se pudieron subir. Por favor, intenta de nuevo.${details}`);
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

    const groupCode = (galleryGroupCodeInput && String(galleryGroupCodeInput.value || '').trim()) ||
        (function () {
            try { return String(localStorage.getItem('galleryGroupCode') || '').trim(); } catch (_e) { return ''; }
        })();

    if (!groupCode) {
        return;
    }

    try {
        const response = await fetch(`${GALLERY_SCRIPT_URL}?action=getPhotos&section=invitados&groupCode=${encodeURIComponent(groupCode)}`);
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
                const fileId = String(photo.fileId || '').trim();

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
                        <img data-file-id="${fileId}"
                             src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" 
                             alt="Foto de ${photo.guestName}" 
                             loading="lazy"
                             >
                        <div class="photo-info">
                            <p class="photo-author">
                                <span class="material-symbols-outlined">person</span> ${photo.guestName}
                            </p>
                            <p class="photo-date">
                                <span class="material-symbols-outlined">schedule</span> ${dateStr}
                            </p>
                        </div>
                    </div>
                `;
                carouselTrack.insertAdjacentHTML('beforeend', slideHtml);
            });

            // Fetch private image bytes (base64) and set <img src="data:...">
            const imgs = carouselTrack.querySelectorAll('img[data-file-id]');
            for (const img of imgs) {
                const fileId = img.getAttribute('data-file-id');
                if (!fileId) continue;
                try {
                    const dataUrl = await fetchPrivateGalleryImageDataUrl(fileId, groupCode);
                    img.src = dataUrl;
                } catch (e) {
                    console.error('Error cargando imagen privada:', e);
                    if (img && img.parentElement) {
                        img.parentElement.innerHTML = '<p style=color:#999>Error al cargar la imagen</p>';
                    }
                }
            }

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

const __galleryImageCache = new Map();

async function fetchPrivateGalleryImageDataUrl(fileId, groupCode) {
    const key = String(fileId || '').trim();
    if (__galleryImageCache.has(key)) return __galleryImageCache.get(key);

    const url = `${GALLERY_SCRIPT_URL}?action=getPhoto&fileId=${encodeURIComponent(key)}&groupCode=${encodeURIComponent(String(groupCode || '').trim())}`;
    const resp = await fetch(url);
    const json = await resp.json();
    if (!json || !json.success) {
        throw new Error((json && json.message) ? json.message : 'No se pudo cargar la imagen');
    }
    const contentType = String(json.contentType || 'image/jpeg');
    const base64 = String(json.base64 || '');
    const dataUrl = `data:${contentType};base64,${base64}`;
    __galleryImageCache.set(key, dataUrl);
    return dataUrl;
}

/**
 * Initialize carousel functionality
 */
let currentSlide = 0;
let totalSlides = 0;
let carouselAutoplay = null;

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
                resetAutoplay();
            }
        };

        nextBtn.onclick = () => {
            if (currentSlide < totalSlides - 1) {
                currentSlide++;
                updateCarousel();
                resetAutoplay();
            }
        };
    }

    // Create indicators
    createCarouselIndicators();

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
            resetAutoplay();
        }
        if (touchEndX > touchStartX + 50 && currentSlide > 0) {
            // Swipe right - previous
            currentSlide--;
            updateCarousel();
            resetAutoplay();
        }
    }

    // Keyboard support (arrow keys) â€” only active while carousel is visible
    let carouselKeyboardActive = false;

    if ('IntersectionObserver' in window) {
        const carouselObserver = new IntersectionObserver((entries) => {
            carouselKeyboardActive = entries[0].isIntersecting;
        }, { threshold: 0.2 });
        carouselObserver.observe(carousel);
    }

    document.addEventListener('keydown', (e) => {
        if (!carouselKeyboardActive) return;
        if (e.key === 'ArrowLeft' && currentSlide > 0) {
            currentSlide--;
            updateCarousel();
            resetAutoplay();
        } else if (e.key === 'ArrowRight' && currentSlide < totalSlides - 1) {
            currentSlide++;
            updateCarousel();
            resetAutoplay();
        }
    });

    // Pause autoplay on hover
    carousel.addEventListener('mouseenter', () => {
        stopAutoplay();
    });

    carousel.addEventListener('mouseleave', () => {
        startAutoplay();
    });

    // Start autoplay if there are photos
    if (total > 1) {
        startAutoplay();
    }
}

function createCarouselIndicators() {
    const carousel = document.getElementById('guest-photos-carousel');
    let indicatorsContainer = carousel.querySelector('.carousel-indicators');

    // Remove existing indicators if any
    if (indicatorsContainer) {
        indicatorsContainer.remove();
    }

    // Create new indicators
    if (totalSlides > 1) {
        indicatorsContainer = document.createElement('div');
        indicatorsContainer.className = 'carousel-indicators';

        for (let i = 0; i < totalSlides; i++) {
            const indicator = document.createElement('div');
            indicator.className = 'carousel-indicator';
            if (i === 0) indicator.classList.add('active');
            indicator.onclick = () => {
                currentSlide = i;
                updateCarousel();
                resetAutoplay();
            };
            indicatorsContainer.appendChild(indicator);
        }

        carousel.appendChild(indicatorsContainer);
    }
}

function startAutoplay() {
    if (totalSlides <= 1) return;

    stopAutoplay();
    carouselAutoplay = setInterval(() => {
        currentSlide = (currentSlide + 1) % totalSlides;
        updateCarousel();
    }, 5000); // Change slide every 5 seconds
}

function stopAutoplay() {
    if (carouselAutoplay) {
        clearInterval(carouselAutoplay);
        carouselAutoplay = null;
    }
}

function resetAutoplay() {
    stopAutoplay();
    startAutoplay();
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

    // Actualizar indicadores
    const indicators = document.querySelectorAll('.carousel-indicator');
    indicators.forEach((indicator, index) => {
        if (index === currentSlide) {
            indicator.classList.add('active');
        } else {
            indicator.classList.remove('active');
        }
    });
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
document.addEventListener('DOMContentLoaded', function () {
    // Wait 1 second before loading photos
    setTimeout(() => {
        loadGuestPhotos();
    }, 1000);
});

function closeRsvpModal() {
    const modal = document.getElementById('rsvp-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scroll
    }
}

// Close modal when clicking outside the content
document.addEventListener('DOMContentLoaded', function () {
    const rsvpModal = document.getElementById('rsvp-modal');
    if (rsvpModal) {
        rsvpModal.addEventListener('click', function (e) {
            if (e.target === rsvpModal) {
                closeRsvpModal();
            }
        });
    }

    // Close modal with the Escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeRsvpModal();
        }
    });
});

/* ============================================
    ENVELOPE ANIMATION
   ============================================ */
function openInvitation() {
    const envelope = document.getElementById('main-envelope');
    const overlay = document.getElementById('intro-overlay');
    const wrapper = document.getElementById('envelope-wrapper');
    const prompt = document.getElementById('open-prompt');

    wrapper.style.pointerEvents = 'none';
    if (prompt) prompt.style.opacity = '0';

    // Phase 1: Flap opens completely
    envelope.classList.add('is-open');

    // Phase 2: After flap is fully open (1.2s), fade everything out
    setTimeout(function () {
        envelope.classList.add('is-fading');
        overlay.style.opacity = '0';

        // Phase 3: Remove overlay after fade-out completes, then start music
        setTimeout(function () {
            overlay.style.visibility = 'hidden';
            overlay.style.display = 'none';
            document.body.classList.remove('envelope-visible');

            // Start music once the invitation is fully open
            if (typeof startMusicAfterEnvelope === 'function') {
                startMusicAfterEnvelope();
            }
        }, 1800);
    }, 1200);
}
