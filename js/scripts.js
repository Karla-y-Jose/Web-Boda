/* ============================================
   WEDDING WEBSITE - MAIN SCRIPTS
   ============================================ */

/* ============================================
   SITE CONFIGURATION
   All dates, venue details, and couple info
   live here. Update once — propagates everywhere.
   ============================================ */
var CONFIG = {
    // Wedding date & time (used by countdown, ticket canvas, calendar links)
    weddingDate:      new Date('2026-12-18T18:00:00'),

    // RSVP confirmation deadline (displayed in RSVP section)
    rsvpDeadline:     new Date('2026-10-01'),
    rsvpDeadlineText: '1° de Octubre',

    // Couple names
    coupleNames:   'Karla & Jose',
    coupleTitle:   'Boda de Karla & Jose',

    // Ceremony
    ceremonyTitle:    'Boda Karla & Jose - Ceremonia',
    ceremonyAddress:  'Parroquia Nuestra Señora de Altagracia, esquina con, De La Mancha, Real del Monte, Altagracia, 45130 Zapopan, Jal.',
    ceremonyShort:    'Parroquia Nuestra Señora de Altagracia, Zapopan, Jal.',
    ceremonyStart:    '20261218T180000',
    ceremonyEnd:      '20261218T190000',

    // Reception
    receptionTitle:   'Boda Karla & Jose - Recepción',
    receptionAddress: 'Jardin de Eventos Andira, Av. de las Calandrias 32, Villas de La Loma, 45134 Nuevo México, Jal.',
    receptionShort:   'Jardin de Eventos Andira, Nuevo México, Jal.',
    receptionStart:   '20261218T200000',
    receptionEnd:     '20261219T020000',

    // Full-day calendar event (used in the RSVP confirmation modal)
    calendarTitle:    'Boda Karla & Jose',
    calendarAddress:  'Ceremonia: Parroquia Nuestra Señora de Altagracia, Zapopan, Jal. | Recepción: Jardin de Eventos Andira, Nuevo México, Jal.',
    calendarStart:    '20261218T180000',
    calendarEnd:      '20261219T020000',

    // Ticket canvas display strings
    ticketDateText:   '18 de diciembre, 2026',

    // Max file size for photo uploads (bytes)
    maxUploadBytes:   5 * 1024 * 1024,
};

/* ============================================
   PRIVATE RSVP SESSION STORE
   Keeps auth token, session data, and ticket
   payload out of the global window scope.
   ============================================ */
var _rsvpStore = (function () {
    var _endpoint          = '';
    var _galleryScriptUrl  = '';
    var _token             = '';
    var _email             = '';
    var _groupCode         = '';
    var _ticketPayload     = null;
    var _lastSubmit        = 0;

    return {
        getEndpoint:         function ()   { return _endpoint; },
        setEndpoint:         function (v)  { _endpoint = String(v || ''); },
        getGalleryScriptUrl: function ()   { return _galleryScriptUrl; },
        setGalleryScriptUrl: function (v)  { _galleryScriptUrl = String(v || ''); },
        getToken:            function ()   { return _token; },
        setToken:            function (v)  { _token = String(v || '').trim(); },
        getEmail:            function ()   { return _email; },
        setEmail:            function (v)  { _email = String(v || '').trim(); },
        getGroupCode:        function ()   { return _groupCode; },
        setGroupCode:        function (v)  { _groupCode = String(v || '').trim(); },
        getTicketPayload:    function ()   { return _ticketPayload; },
        setTicketPayload:    function (v)  { _ticketPayload = v; },
        updateTicketId:      function (id) { if (_ticketPayload) _ticketPayload.ticketId = String(id || '').trim(); },
        canSubmit:           function (ms) { return (Date.now() - _lastSubmit) >= (ms || 15000); },
        recordSubmit:        function ()   { _lastSubmit = Date.now(); },
        clearSession:        function ()   { _token = ''; _email = ''; _groupCode = ''; },
        clearAll:            function ()   { _token = ''; _email = ''; _groupCode = ''; _ticketPayload = null; }
    };
}());

// ─── Tiny DOM helpers (replace jQuery's most-used patterns) ──────────────────

// Set innerHTML of a selector target (replaces $(sel).html(str))
function _setHtml(sel, html) {
    var el = (typeof sel === 'string') ? document.querySelector(sel) : sel;
    if (el) el.innerHTML = html;
}

// Show an element (replaces $(sel).show())
function _show(sel) {
    var el = (typeof sel === 'string') ? document.querySelector(sel) : sel;
    if (el) {
        el.style.display = 'block';
    }
}

// Hide an element (replaces $(sel).hide())
function _hide(sel) {
    var el = (typeof sel === 'string') ? document.querySelector(sel) : sel;
    if (el) {
        el.style.display = 'none';
    }
}

// Toggle a class on an element (replaces $(sel).toggleClass(cls))
function _toggleClass(sel, cls) {
    var el = (typeof sel === 'string') ? document.querySelector(sel) : sel;
    if (el) el.classList.toggle(cls);
}

// Escapes the five HTML-special characters so a server-supplied string can be
// safely interpolated into an innerHTML/insertAdjacentHTML template.
// Use this for EVERY string that comes from an API response before injecting it
// into the DOM. Strings used only with textContent do NOT need this.
var _escHtmlDiv = document.createElement('div');
function _escHtml(str) {
    _escHtmlDiv.textContent = String(str == null ? '' : str);
    return _escHtmlDiv.innerHTML;
}

// Builds a Bootstrap-style dismissible alert banner.
// alert_type: 'success' | 'danger' | 'warning' | 'info'
function alert_markup(alert_type, msg) {
    return '<div class="alert alert-' + alert_type + ' alert-dismissible" role="alert" style="margin-bottom: 20px;">'
        + msg
        + '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>';
}

// Displays an inline alert inside a container element.
// type: 'success' | 'danger' | 'warning' | 'info'
function _showInlineMsg(containerId, type, msg) {
    var el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = alert_markup(type, _escHtml(msg));
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ─── Focus trap utility ───────────────────────────────────────────────────────
// Traps Tab / Shift+Tab inside a modal element so keyboard focus cannot
// escape to elements behind the overlay.
// Returns a cleanup function that removes the listener.
function _trapFocus(modalEl) {
    var FOCUSABLE = [
        'a[href]', 'button:not([disabled])', 'input:not([disabled])',
        'select:not([disabled])', 'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])'
    ].join(',');

    function getFocusable() {
        return Array.from(modalEl.querySelectorAll(FOCUSABLE))
            .filter(function (el) { return !el.closest('[hidden]'); });
    }

    function handler(e) {
        if (e.key !== 'Tab') return;
        var focusable = getFocusable();
        if (!focusable.length) { e.preventDefault(); return; }
        var first = focusable[0];
        var last  = focusable[focusable.length - 1];
        if (e.shiftKey) {
            if (document.activeElement === first) {
                e.preventDefault();
                last.focus();
            }
        } else {
            if (document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    }
    modalEl.addEventListener('keydown', handler);
    return function cleanup() { modalEl.removeEventListener('keydown', handler); };
}


// Shows N animated skeleton rows in the guests container while the search
// request is in flight. Replaced by real content in displayGuestList().
function _showGuestSkeleton(count) {
    var container = document.getElementById('guests-container');
    if (!container) return;

    var fragment = document.createDocumentFragment();
    for (var i = 0; i < (count || 3); i++) {
        var row = document.createElement('div');
        row.className = 'guest-skeleton';
        ['wide', 'mid', 'short'].forEach(function(cls) {
            var line = document.createElement('div');
            line.className = 'skeleton-line ' + cls;
            row.appendChild(line);
        });
        fragment.appendChild(row);
    }
    container.innerHTML = '';
    container.appendChild(fragment);
}

// ─── Initialisation (replaces $(document).ready()) ───────────────────────────
// Scripts.js is loaded at the end of <body>, so the DOM is already ready.
// We use DOMContentLoaded as a belt-and-suspenders fallback.
(function init() {

    // ========== Mobile hamburger menu (Transformicon) ==========
    // Toggles the animated icon state and slides the nav panel open/closed.
    var navToggle = document.querySelector('.nav-toggle');
    var headerNav = document.querySelector('.header-nav');

    if (navToggle && headerNav) {
        navToggle.addEventListener('click', function (e) {
            e.preventDefault();
            navToggle.classList.toggle('active');
            headerNav.classList.toggle('open');
        });

        // Also close the nav when the user taps any menu link
        headerNav.querySelectorAll('li a').forEach(function (link) {
            link.addEventListener('click', function () {
                navToggle.classList.toggle('active');
                headerNav.classList.toggle('open');
            });
        });
    }

    // ========== Header BG Scroll ==================
    // Pins the nav bar and collapses the header padding once the user scrolls past 20px.
    var navigationEl = document.querySelector('.navigation');
    var headerEl     = document.querySelector('header');

    window.addEventListener('scroll', function () {
        var scrollY = window.scrollY || window.pageYOffset;

        if (scrollY >= 20) {
            if (navigationEl) navigationEl.classList.add('fixed');
            // Collapse header padding and hide the decorative keyline (header::after)
            if (headerEl) {
                headerEl.classList.add('scrolled');
                headerEl.style.padding = '35px 0';
            }
        } else {
            if (navigationEl) navigationEl.classList.remove('fixed');
            // Restore full header padding and show the decorative keyline
            if (headerEl) {
                headerEl.classList.remove('scrolled');
                headerEl.style.padding = '50px 0';
            }
        }
    }, { passive: true });

    // ========== Countdown timer ==========
    // Tick immediately so the display is populated on page load, then update every second.
    updateDeadlineCountdown();
    updateCountdown();
    setInterval(updateCountdown, 1000);

    // Apps Script endpoint for all RSVP requests.
    // NOTE: This URL is visible in the client bundle. Real protection lives server-side:
    // every action that mutates data (updateAttendance, sendTicketEmail) requires a
    // short-lived token issued by the server on a successful searchGuest call.
    // Read-only actions (searchGuest, getPhotos) are intentionally public.
    _rsvpStore.setEndpoint('https://script.google.com/macros/s/AKfycbyhpyTZIsYGVzv2zbNMyTvW1ZX0Unoz8iwhV__gXfVi5xuW7erTy8scjCpM71UUC39bqw/exec');
    _rsvpStore.setGalleryScriptUrl('https://script.google.com/macros/s/AKfycbxbEAnYtm2MBjrDkkKBJ0phsWnE2VizAK5Up5oQJLp5PPi3T8ZpnGqTVI-FvN-NF_67/exec');

    var currentGuests = [];

    // ========== RSVP: Step 1 – search for a guest by name, email and group code ==========
    // On submit, clears any previous session and fires a GET request to the Apps Script.
    // A successful response populates currentGuests and shows the attendance selection UI.
    var rsvpSearchForm = document.getElementById('rsvp-search-form');
    if (rsvpSearchForm) {
        rsvpSearchForm.addEventListener('submit', function (e) {
            e.preventDefault();

            var searchName = document.getElementById('rsvp-search-name').value.trim();
            var email      = String(document.getElementById('rsvp-search-email').value || '').trim();
            var groupCode  = String(document.getElementById('rsvp-group-code').value || '').trim();
            var btn        = rsvpSearchForm.querySelector('button[type="submit"]');

            if (!searchName) {
                _setHtml('#alert-wrapper', alert_markup('warning', 'Por favor ingresa tu nombre.'));
                return;
            }
            if (!email) {
                _setHtml('#alert-wrapper', alert_markup('warning', 'Por favor ingresa tu correo.'));
                return;
            }
            if (!groupCode) {
                _setHtml('#alert-wrapper', alert_markup('warning', 'Por favor ingresa tu código de grupo.'));
                return;
            }

            // Client-side rate limit: enforce a 15-second cooldown between search attempts
            if (!_rsvpStore.canSubmit(15000)) {
                _setHtml('#alert-wrapper', alert_markup('warning', 'Por favor espera unos segundos antes de intentar de nuevo.'));
                return;
            }
            _rsvpStore.recordSubmit();

            // Reset previous auth state on a new search
            _rsvpStore.clearSession();

            _setHtml('#alert-wrapper', alert_markup('info', '<strong>Buscando...</strong> Por favor espera.'));
            if (btn) btn.disabled = true;

            // Show skeleton immediately so the UI doesn't look frozen on slow connections
            _hide('#rsvp-search-container');
            _show('#rsvp-guest-list');
            _showGuestSkeleton(3);

            // Use GET with URL params to avoid CORS issues
            var url = _rsvpStore.getEndpoint()
                + '?action=searchGuest'
                + '&name='      + encodeURIComponent(searchName)
                + '&email='     + encodeURIComponent(email)
                + '&groupCode=' + encodeURIComponent(groupCode);

            fetch(url)
                .then(function (resp) {
                    if (!resp.ok) throw new Error('HTTP ' + resp.status);
                    return resp.json();
                })
                .then(function (response) {
                    if (response.result === 'success') {
                        // Store token when server returns one
                        if (response.token) {
                            _rsvpStore.setToken(response.token);
                            _rsvpStore.setEmail(email);
                            _rsvpStore.setGroupCode(groupCode);
                        }
                        currentGuests = response.invitados;
                        try {
                            displayGuestList(response.grupo, response.invitados);
                        } catch (err) {
                            console.error('Error displaying guest list:', err);
                            _hide('#rsvp-guest-list');
                            _show('#rsvp-search-container');
                            _setHtml('#alert-wrapper', alert_markup('danger', '<strong>Error:</strong> No se pudo cargar la lista de invitados. ' + err.message));
                        }
                    } else if (response.result === 'not_found') {
                        _hide('#rsvp-guest-list');
                        _show('#rsvp-search-container');
                        _setHtml('#alert-wrapper', alert_markup('warning', _escHtml(response.message)));
                    } else {
                        _hide('#rsvp-guest-list');
                        _show('#rsvp-search-container');
                        _setHtml('#alert-wrapper', alert_markup('danger', '<strong>Error:</strong> ' + _escHtml(response.message)));
                    }
                })
                .catch(function (err) {
                    console.error('Search error:', err);
                    _hide('#rsvp-guest-list');
                    _show('#rsvp-search-container');
                    _setHtml('#alert-wrapper', alert_markup('danger', '<strong>Error de conexión.</strong> Por favor intenta más tarde.'));
                })
                .finally(function () {
                    if (btn) btn.disabled = false;
                });
        });
    }

    // ========== RSVP: Build guest list UI ==========
    // Renders a radio-button card for each guest showing their current attendance state.
    function displayGuestList(groupName, guests) {
        _setHtml('#alert-wrapper', '');
        _hide('#rsvp-search-container');
        _show('#rsvp-guest-list');

        var groupNameEl = document.getElementById('group-name');
        if (groupNameEl) {
            groupNameEl.textContent = groupName;
        } else {
            console.error('group-name element not found');
        }

        var guestsContainer = document.getElementById('guests-container');
        if (!guestsContainer) {
            console.error('guests-container element not found in DOM');
            return;
        }

        // Build DOM nodes instead of raw HTML to prevent XSS from server-supplied names
        var fragment = document.createDocumentFragment();

        guests.forEach(function (guest, index) {
            var currentState = guest.estado || 'Pendiente';

            var item = document.createElement('div');
            item.className = 'guest-item';
            item.dataset.rowIndex = guest.rowIndex;

            // Guest name row
            var nameDiv = document.createElement('div');
            nameDiv.className = 'guest-name';
            var iconSpan = document.createElement('span');
            iconSpan.className = 'material-symbols-outlined';
            iconSpan.textContent = 'person';
            nameDiv.appendChild(iconSpan);
            nameDiv.appendChild(document.createTextNode(' ' + String(guest.nombre || '') + ' ' + String(guest.apellido || '')));
            item.appendChild(nameDiv);

            // Attendance options
            var optionsDiv = document.createElement('div');
            optionsDiv.className = 'attendance-options';

            var options = [
                { cls: 'confirmed',    value: 'Confirmado', icon: 'check_circle', label: 'Confirmar' },
                { cls: 'not-attending', value: 'No Asiste',  icon: 'cancel',       label: 'No Asistirá' },
                { cls: 'pending',      value: 'Pendiente',  icon: 'schedule',     label: 'Pendiente' }
            ];

            options.forEach(function (opt) {
                var optDiv = document.createElement('div');
                optDiv.className = 'attendance-option ' + opt.cls;

                var label = document.createElement('label');
                var input = document.createElement('input');
                input.type = 'radio';
                input.name = 'guest_' + index;
                input.value = opt.value;
                if (currentState === opt.value) input.checked = true;

                var span = document.createElement('span');
                var ic = document.createElement('span');
                ic.className = 'material-symbols-outlined';
                ic.textContent = opt.icon;
                span.appendChild(ic);
                span.appendChild(document.createTextNode(' ' + opt.label));

                label.appendChild(input);
                label.appendChild(span);
                optDiv.appendChild(label);
                optionsDiv.appendChild(optDiv);
            });

            item.appendChild(optionsDiv);
            fragment.appendChild(item);
        });

        guestsContainer.innerHTML = '';
        guestsContainer.appendChild(fragment);
    }

    // ========== RSVP: Step 2 – confirm attendance for each guest in the group ==========
    // Collects the selected radio state for every guest item, builds an update list,
    // stores a ticket payload, and sends the changes to the Apps Script via GET.
    // On success, displays the confirmation modal with calendar and ticket buttons.
    var confirmBtn = document.getElementById('confirm-attendance-btn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function () {
            if (!_rsvpStore.getToken()) {
                _setHtml('#confirm-alert-wrapper', alert_markup('danger', '<strong>Error:</strong> Primero realiza la búsqueda con tu código para continuar.'));
                return;
            }

            var btn = confirmBtn;
            var updates = [];
            var confirmedGuestNames = [];
            var groupNameEl = document.getElementById('group-name');
            var groupName = groupNameEl ? String(groupNameEl.textContent || '').trim() : '';

            document.querySelectorAll('.guest-item').forEach(function (item, index) {
                var rowIndex = item.dataset.rowIndex;
                var checkedInput = item.querySelector('input[type="radio"]:checked');
                var selectedState = checkedInput ? checkedInput.value : undefined;

                if (selectedState === 'Confirmado' && Array.isArray(currentGuests) && currentGuests[index]) {
                    var g = currentGuests[index];
                    confirmedGuestNames.push(String((g.nombre || '') + ' ' + (g.apellido || '')).trim());
                }

                updates.push({ rowIndex: rowIndex, estado: selectedState });
            });

            // Store ticket payload for the confirmation modal
            _rsvpStore.setTicketPayload({
                groupName: groupName,
                confirmedGuests: confirmedGuestNames.filter(Boolean),
                generatedAt: Date.now(),
                ticketId: ''
            });

            _setHtml('#confirm-alert-wrapper', alert_markup('info', '<strong>Guardando...</strong> Por favor espera.'));
            btn.disabled = true;
            _rsvpStore.recordSubmit();

            // POST with application/x-www-form-urlencoded (simple request — no CORS preflight).
            // Token and guest row data must never travel in a URL: they appear in server
            // logs, referrer headers, and browser history.
            fetch(_rsvpStore.getEndpoint(), {
                method: 'POST',
                body: new URLSearchParams({
                    action:  'updateAttendance',
                    updates: JSON.stringify(updates),
                    token:   _rsvpStore.getToken()
                })
            })
                .then(function (resp) {
                    if (!resp.ok) throw new Error('HTTP ' + resp.status);
                    return resp.json();
                })
                .then(function (response) {
                    if (response.result === 'success') {
                        // Attach server-issued ticket code (verifiable against the sheet)
                        if (response.ticketId && _rsvpStore.getTicketPayload()) {
                            _rsvpStore.updateTicketId(response.ticketId);
                        }
                        _setHtml('#confirm-alert-wrapper', alert_markup('success', '<strong>¡Listo!</strong> ' + _escHtml(response.message)));

                        // Show confirmation modal
                        setTimeout(function () {
                            var rsvpModal = document.getElementById('rsvp-modal');
                            if (rsvpModal) rsvpModal.classList.add('active');

                            // Build calendar + ticket buttons using DOM API (no innerHTML)
                            var _tp = _rsvpStore.getTicketPayload();
                            var tickets = (_tp && Array.isArray(_tp.confirmedGuests)) ? _tp.confirmedGuests : [];

                            var addToCal = document.getElementById('add-to-cal');
                            if (!addToCal) return;
                            addToCal.innerHTML = ''; // clear any previous buttons

                            var btnRow = document.createElement('div');
                            btnRow.style.cssText = 'display:flex;flex-direction:row;gap:0.75rem;margin-top:20px;';

                            // Calendar button
                            var calBtn = document.createElement('button');
                            calBtn.className = 'calendar-btn-modal';
                            calBtn.addEventListener('click', function () {
                                agregarAlCalendario(
                                    CONFIG.calendarTitle,
                                    CONFIG.calendarAddress,
                                    CONFIG.calendarStart,
                                    CONFIG.calendarEnd
                                );
                            });
                            var calIcon = document.createElement('span');
                            calIcon.className = 'material-symbols-outlined';
                            calIcon.style.cssText = 'font-size:18px;vertical-align:middle;';
                            calIcon.textContent = 'calendar_month';
                            calBtn.appendChild(calIcon);
                            calBtn.appendChild(document.createTextNode(' Añadir al Calendario'));
                            btnRow.appendChild(calBtn);

                            // Ticket download button (only when there are confirmed guests)
                            if (tickets.length > 0) {
                                var label = tickets.length === 1 ? 'Descargar boleto' : 'Descargar boletos';
                                var ticketBtn = document.createElement('button');
                                ticketBtn.type = 'button';
                                ticketBtn.className = 'calendar-btn-modal';
                                ticketBtn.addEventListener('click', downloadRsvpTickets);
                                var ticketIcon = document.createElement('span');
                                ticketIcon.className = 'material-symbols-outlined';
                                ticketIcon.style.cssText = 'font-size:18px;vertical-align:middle;';
                                ticketIcon.textContent = 'confirmation_number';
                                ticketBtn.appendChild(ticketIcon);
                                ticketBtn.appendChild(document.createTextNode(' ' + label));
                                btnRow.appendChild(ticketBtn);
                            }

                            addToCal.appendChild(btnRow);
                        }, 1500);
                    } else {
                        _setHtml('#confirm-alert-wrapper', alert_markup('danger', '<strong>Error:</strong> ' + _escHtml(response.message)));
                    }
                })
                .catch(function (err) {
                    console.error('Update error:', err);
                    _setHtml('#confirm-alert-wrapper', alert_markup('danger', '<strong>Error de conexión.</strong> Por favor intenta más tarde.'));
                })
                .finally(function () {
                    btn.disabled = false;
                });
        });
    }

    // ========== RSVP: Back button – reset to the search step ==========
    // Hides the guest list, clears all form fields, and wipes the session store
    // so the next search starts with a clean state.
    var backBtn = document.getElementById('back-to-search-btn');
    if (backBtn) {
        backBtn.addEventListener('click', function () {
            _hide('#rsvp-guest-list');
            _show('#rsvp-search-container');
            var nameEl  = document.getElementById('rsvp-search-name');
            var emailEl = document.getElementById('rsvp-search-email');
            var codeEl  = document.getElementById('rsvp-group-code');
            if (nameEl)  nameEl.value  = '';
            if (emailEl) emailEl.value = '';
            if (codeEl)  codeEl.value  = '';
            _rsvpStore.clearAll();
            _setHtml('#alert-wrapper', '');
            _setHtml('#confirm-alert-wrapper', '');
        });
    }



    // ========== Listeners wired here to replace inline onclick= attributes ==========
    // These replace every onclick="..." removed from index.html so the CSP
    // can enforce script-src 'self' without needing 'unsafe-inline'.

    // Envelope – open invitation on click AND on Enter/Space (keyboard a11y)
    var envelopeWrapper = document.getElementById('envelope-wrapper');
    if (envelopeWrapper) {
        envelopeWrapper.addEventListener('click', openInvitation);
        envelopeWrapper.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openInvitation();
            }
        });
    }

    // Ceremony calendar button
    var calBtnCeremony = document.getElementById('cal-btn-ceremony');
    if (calBtnCeremony) {
        calBtnCeremony.addEventListener('click', function () {
            agregarAlCalendario(
                CONFIG.ceremonyTitle,
                CONFIG.ceremonyAddress,
                CONFIG.ceremonyStart,
                CONFIG.ceremonyEnd
            );
        });
    }

    // Reception calendar button
    var calBtnReception = document.getElementById('cal-btn-reception');
    if (calBtnReception) {
        calBtnReception.addEventListener('click', function () {
            agregarAlCalendario(
                CONFIG.receptionTitle,
                CONFIG.receptionAddress,
                CONFIG.receptionStart,
                CONFIG.receptionEnd
            );
        });
    }

    // Upload modal trigger
    var uploadTriggerBtn = document.getElementById('upload-trigger-btn');
    if (uploadTriggerBtn) {
        uploadTriggerBtn.addEventListener('click', openUploadModal);
    }

    // Close RSVP modal button (X button inside modal)
    var closeRsvpModalBtn = document.getElementById('close-rsvp-modal-btn');
    if (closeRsvpModalBtn) {
        closeRsvpModalBtn.addEventListener('click', closeRsvpModal);
    }

    // Upload modal: close when clicking the backdrop, stop propagation from inner content
    var uploadModal = document.getElementById('upload-modal');
    if (uploadModal) {
        uploadModal.addEventListener('click', function (e) {
            if (e.target === uploadModal) closeUploadModal();
        });
        var uploadModalContent = uploadModal.querySelector('.upload-modal-content');
        if (uploadModalContent) {
            uploadModalContent.addEventListener('click', function (e) { e.stopPropagation(); });
        }
    }

    // Close upload modal button (X button inside modal)
    var closeUploadModalBtn = document.getElementById('close-upload-modal-btn');
    if (closeUploadModalBtn) {
        closeUploadModalBtn.addEventListener('click', closeUploadModal);
    }

    // Photo lightbox: close when clicking backdrop, stop propagation from image content
    var photoLightbox = document.getElementById('photo-lightbox');
    if (photoLightbox) {
        photoLightbox.addEventListener('click', function (e) {
            if (e.target === photoLightbox) closePhotoLightbox();
        });
        var lightboxContent = photoLightbox.querySelector('.lightbox-content');
        if (lightboxContent) {
            lightboxContent.addEventListener('click', function (e) { e.stopPropagation(); });
        }
    }

    // Lightbox close button
    var lightboxCloseBtn = document.getElementById('lightbox-close-btn');
    if (lightboxCloseBtn) {
        lightboxCloseBtn.addEventListener('click', closePhotoLightbox);
    }

}()); // end init()

// ─── Functions below are called from outside the init IIFE ───────────────────

// Triggered by the "Descargar boleto(s)" button inside the RSVP confirmation modal.
// Generates a PNG ticket via canvas, triggers a browser download, and e-mails
// a copy to the guest's verified address.
function downloadRsvpTickets() {
    var payload   = _rsvpStore.getTicketPayload();
    var guests    = payload && Array.isArray(payload.confirmedGuests) ? payload.confirmedGuests : [];
    var groupName = payload && typeof payload.groupName === 'string' ? payload.groupName : '';
    var ticketId  = payload && typeof payload.ticketId  === 'string' ? payload.ticketId  : '';

    if (!guests.length) {
        _showInlineMsg('add-to-cal', 'warning', 'No hay boletos disponibles para descargar.');
        return;
    }

    var safeGroup = String(groupName || 'grupo')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '')
        .toLowerCase();
    var filename = guests.length === 1
        ? ('boleto-'  + safeGroup + '.png')
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
            if (_rsvpStore.getToken()) {
                sendTicketEmail(dataUrl, filename).catch(function (e) {
                    console.error('Ticket email failed:', e);
                    _showInlineMsg('add-to-cal', 'warning', 'No se pudo enviar el boleto por correo. Intenta de nuevo.');
                });
            }
        })
        .catch(function (e) {
            console.error('Ticket generation failed:', e);
            _showInlineMsg('add-to-cal', 'danger', 'No se pudo generar el boleto. Intenta de nuevo.');
        });
}

// POSTs the generated ticket PNG (as a base64 data URL) to the Apps Script so it
// can e-mail a copy to the address that was verified during the RSVP search.
// Uses fetch with application/x-www-form-urlencoded to avoid CORS preflight.
function sendTicketEmail(ticketDataUrl, filename) {
    var endpoint = _rsvpStore.getEndpoint();
    if (!endpoint || !_rsvpStore.getToken()) return Promise.reject(new Error('Missing RSVP auth token'));

    var payload = {
        action:       'sendTicketEmail',
        token:        String(_rsvpStore.getToken()),
        ticketDataUrl: String(ticketDataUrl || ''),
        filename:     String(filename || '')
    };

    // Use application/x-www-form-urlencoded (simple request) to avoid CORS preflight
    // that Apps Script doesn't handle.
    return fetch(endpoint, {
        method: 'POST',
        body:   new URLSearchParams(payload)
    })
        .then(function (resp) { return resp.json(); })
        .then(function (json) {
            if (!json || json.result !== 'success') {
                throw new Error((json && json.message) ? json.message : 'Email failed');
            }
            return json;
        });
}

// Returns a URL to the static validation page.
// Used as the QR code payload so event staff can scan and see the validation page.
function buildVerifyTicketUrl(ticketId) {
    // Point to the static validation page
    return 'validar-boleto.html?ticketId=' + encodeURIComponent(String(ticketId || '').trim());
}

// Renders a QR code entirely in the browser using the bundled qrcode library.
// sizePx: desired canvas dimension in pixels (default 240).
// Returns a PNG data URL.
function generateQrDataUrlLocal(text, sizePx) {
    if (typeof qrcode !== 'function') {
        throw new Error('QR library not loaded');
    }
    var size = Number(sizePx) > 0 ? Number(sizePx) : 240;
    var qr = qrcode(0, 'M');
    qr.addData(String(text || ''));
    qr.make();

    var count  = qr.getModuleCount();
    var canvas = document.createElement('canvas');
    canvas.width  = size;
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

// Returns a Promise<string> that resolves to a QR PNG data URL for the ticket.
// Tries to fetch a pre-rendered QR from the server first; falls back to
// generating one locally if the server call fails.
function getQrDataUrlForTicket(ticketId) {
    return fetchTicketQrDataUrl(ticketId)
        .catch(function () {
            var verifyUrl = buildVerifyTicketUrl(ticketId);
            if (!verifyUrl) return '';
            return generateQrDataUrlLocal(verifyUrl, 240);
        });
}

// Fetches a server-generated QR code PNG (as a data URL) from the Apps Script.
// Rejects if the endpoint is unavailable or the server returns an error.
function fetchTicketQrDataUrl(ticketId) {
    var endpoint = _rsvpStore.getEndpoint();
    if (!endpoint) return Promise.reject(new Error('RSVP endpoint not available'));

    var url = endpoint + '?action=getTicketQr&ticketId=' + encodeURIComponent(String(ticketId || '').trim());

    return fetch(url)
        .then(function (resp) { return resp.json(); })
        .then(function (json) {
            if (!json || json.result !== 'success' || !json.qrDataUrl) {
                throw new Error((json && json.message) ? json.message : 'QR unavailable');
            }
            return String(json.qrDataUrl);
        });
}

// Resolves a relative asset path to an absolute URL using the page's base URI.
// Ensures image loads work correctly regardless of the server's base path.
function resolveAssetUrl(path) {
    try {
        return new URL(String(path || ''), document.baseURI || window.location.href).href;
    } catch (_e) {
        return String(path || '');
    }
}

// Loads an image from `src` into an HTMLImageElement for use on a canvas.
// Returns a Promise that resolves with the loaded image or rejects on error.
function loadImageForCanvas(src) {
    return new Promise(function (resolve, reject) {
        var img = new Image();
        // Do not force crossOrigin here; it can break loads in some local hosting setups.
        img.onload  = function () { resolve(img); };
        img.onerror = function () { reject(new Error('Failed to load image: ' + src)); };
        img.src = resolveAssetUrl(src);
    });
}

// Loads an image in a way that avoids canvas tainting from cross-origin sources.
// Data/blob URLs are loaded directly; other URLs are fetched as a blob first
// so that canvas.toDataURL() can be called without a SecurityError.
function loadImageForCanvasUntainted(src) {
    var resolved = resolveAssetUrl(src);

    // Data/blob URLs are safe to draw.
    if (/^(data:|blob:)/i.test(resolved)) {
        return loadImageForCanvas(resolved);
    }

    // Best effort: fetch as a blob and draw from a same-origin blob: URL.
    return fetch(resolved, { cache: 'no-store' })
        .then(function (resp) {
            if (!resp.ok) throw new Error('Image fetch failed: ' + resp.status);
            return resp.blob();
        })
        .then(function (blob) {
            var objUrl = URL.createObjectURL(blob);
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

// Returns the URL of the wedding logo that is already loaded in the page DOM.
// Falls back to the known relative path when no img element is found.
function getTicketLogoUrl() {
    var el = document.querySelector('img[src*="logo2.webp"]');
    if (el && el.src) return el.src;
    return 'img/logo2.webp';
}

// Draws an image centred and scaled to fit inside the (x, y, w, h) rectangle
// using the "contain" strategy (no cropping, letter-boxing preserved).
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

// Generates the RSVP ticket as a 1400×800 PNG data URL drawn on an off-screen canvas.
// opts: { groupName, guests[], ticketId, qrDataUrl }
// Returns a Promise<string> (PNG data URL).
function generateRsvpTicketPng(opts) {
    var groupName = (opts && opts.groupName) ? String(opts.groupName) : '';
    var guests    = (opts && Array.isArray(opts.guests)) ? opts.guests.map(String).filter(Boolean) : [];
    var ticketId  = (opts && opts.ticketId)  ? String(opts.ticketId).trim()  : '';
    var qrDataUrl = (opts && opts.qrDataUrl) ? String(opts.qrDataUrl)        : '';

    var canvas  = document.createElement('canvas');
    canvas.width  = 1400;
    canvas.height = 800;
    var ctx = canvas.getContext('2d');

    // Palette matches existing site colors.
    var greenDark = '#0F3B2E';
    var green     = '#2E8B57';
    var gold      = '#d4af37';
    var grayText  = '#4a4a4a';

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
            ctx.fillText(CONFIG.coupleTitle, 70, 125);

            ctx.fillStyle = grayText;
            ctx.font = '600 30px Manrope, Arial, sans-serif';
            ctx.fillText('Confirmación de asistencia', 70, 210);

            ctx.fillStyle = green;
            ctx.font = '600 26px Manrope, Arial, sans-serif';
            ctx.fillText('Fecha:', 70, 265);
            ctx.fillStyle = grayText;
            ctx.font = '400 26px Manrope, Arial, sans-serif';
            ctx.fillText(CONFIG.ticketDateText, 155, 265);

            ctx.fillStyle = green;
            ctx.font = '600 26px Manrope, Arial, sans-serif';
            ctx.fillText('Grupo:', 70, 310);
            ctx.fillStyle = grayText;
            ctx.font = '400 26px Manrope, Arial, sans-serif';
            ctx.fillText(groupName || '—', 160, 310);

            ctx.fillStyle = green;
            ctx.font = '600 26px Manrope, Arial, sans-serif';
            ctx.fillText('Invitados confirmados:', 70, 370);

            ctx.fillStyle = grayText;
            ctx.font = '400 26px Manrope, Arial, sans-serif';
            var startY     = 415;
            var lineHeight = 34;
            var maxLines   = 8;
            for (var i = 0; i < Math.min(guests.length, maxLines); i++) {
                ctx.fillText('• ' + guests[i], 90, startY + (i * lineHeight));
            }
            if (guests.length > maxLines) {
                ctx.fillStyle = '#777';
                ctx.fillText('…y ' + (guests.length - maxLines) + ' más', 90, startY + (maxLines * lineHeight));
            }

            ctx.fillStyle = '#777';
            ctx.font = '400 22px Manrope, Arial, sans-serif';
            ctx.fillText('Presenta este boleto el día del evento.', 70, 730);

            if (ticketId) {
                ctx.fillStyle = '#777';
                ctx.font = '600 22px Manrope, Arial, sans-serif';
                ctx.fillText('Código: ' + ticketId, 70, 765);
            }

            if (ticketId && qrImg) {
                var qrSize = 220;
                var qrX    = canvas.width - (qrSize + 80);
                var qrY    = canvas.height - (qrSize + 110);
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
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.globalAlpha = 1;
                ctx.globalCompositeOperation = 'source-over';
                if ('filter' in ctx) ctx.filter = 'none';

                logoImg = null;
                qrImg   = null;
                drawBackgroundAndWatermark();
                drawTextAndQRCode();

                return canvas.toDataURL('image/png');
            }
            throw e;
        }
    }

    // Use the resolved DOM URL first to avoid path issues.
    var logoPromise = loadImageForCanvasUntainted(getTicketLogoUrl())
        .catch(function () { return loadImageForCanvasUntainted('img/logo2.webp'); })
        .catch(function () { return loadImageForCanvasUntainted('./img/logo2.webp'); })
        .catch(function () { return null; });
    var qrPromise = qrDataUrl
        ? loadImageForCanvasUntainted(qrDataUrl).catch(function () { return null; })
        : Promise.resolve(null);

    return Promise.all([logoPromise, qrPromise]).then(function (results) {
        var logoImg = results[0] || null;
        var qrImg   = results[1] || null;
        return drawTicket(logoImg, qrImg);
    });
}

// Triggers a browser download for a data URL with the given filename.
function downloadDataUrl(dataUrl, filename) {
    var a = document.createElement('a');
    a.href     = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
}

// Calculates the remaining time until the wedding and updates the hero countdown
// elements (days, hours, minutes, seconds). Shows a celebration message when
// the target date has passed.
// Updates the RSVP deadline pill with "X días para confirmar".
// Runs once on page load — the deadline doesn't change second-by-second.
function updateDeadlineCountdown() {
    var el = document.getElementById('rsvp-deadline-countdown');
    if (!el) return;

    var now  = Date.now();
    var diff = CONFIG.rsvpDeadline.getTime() - now;

    if (diff <= 0) {
        el.textContent = '¡Plazo vencido!';
        el.className = 'rsvp-deadline-countdown overdue';
        return;
    }

    var days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    var label = days === 1 ? '1 día restante' : days + ' días restantes';
    el.textContent = label;
    // Amber warning when fewer than 14 days remain
    el.className = 'rsvp-deadline-countdown' + (days < 14 ? ' urgent' : '');
}

function updateCountdown() {
    var weddingDate = CONFIG.weddingDate.getTime();
    var now         = new Date().getTime();
    var diff        = weddingDate - now;

    if (diff <= 0) {
        var heroEl = document.getElementById('countdown-hero');
        if (heroEl) {
            heroEl.innerHTML = '<p style="color: #2E8B57;">¡El gran día ha llegado!</p>';
        }
        return;
    }

    var days    = Math.floor(diff / (1000 * 60 * 60 * 24));
    var hours   = Math.floor((diff / (1000 * 60 * 60)) % 24);
    var minutes = Math.floor((diff / (1000 * 60)) % 60);
    var seconds = Math.floor((diff / 1000) % 60);

    document.getElementById('d-hero').textContent = String(days).padStart(2, '0');
    document.getElementById('h-hero').textContent = String(hours).padStart(2, '0');
    document.getElementById('m-hero').textContent = String(minutes).padStart(2, '0');
    document.getElementById('s-hero').textContent = String(seconds).padStart(2, '0');
}

// Opens a calendar-picker modal with Google Calendar and Apple Calendar (.ics) options.
// titulo, ubicacion: plain-text event details
// inicio, fin: date-time strings in YYYYMMDDTHHMMSS format (local time)
function agregarAlCalendario(titulo, ubicacion, inicio, fin) {
    // Guard against double-injection from rapid clicks
    if (document.getElementById('calendar-modal-container')) return;

    var encodedTitulo    = encodeURIComponent(titulo);
    var encodedUbicacion = encodeURIComponent(ubicacion);

    // Generate an ICS file for Apple Calendar
    var icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//' + CONFIG.coupleNames + '//ES',
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
    var icsUrl  = URL.createObjectURL(icsBlob);

    var opciones = `
        <div id="calendar-modal-overlay" class="gifts-modal active" style="z-index: 9998;">
            <div class="gifts-modal-content calendar-modal-content">
                <button id="calendar-modal-close-btn" class="gifts-modal-close calendar-modal-close" aria-label="Cerrar">
                    <span class="material-symbols-outlined">close</span>
                </button>
                <span class="registry-eyebrow" style="display:block; text-align:center;">Añadir al Calendario</span>
                <h3 class="calendar-modal-heading">Elige tu aplicación</h3>
                <p class="calendar-modal-sub">Selecciona tu app de calendario preferida</p>

                <div class="calendar-grid">

                    <a href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodedTitulo}&dates=${inicio}/${fin}&location=${encodedUbicacion}"
                       target="_blank" rel="noopener noreferrer" class="registry-card">
                        <div class="gold-corner tl"></div>
                        <div class="gold-corner tr"></div>
                        <div class="gold-corner bl"></div>
                        <div class="gold-corner br"></div>
                        <div class="registry-card-icon">
                            <span class="material-symbols-outlined" aria-hidden="true">calendar_today</span>
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
                        <div class="gold-corner tl"></div>
                        <div class="gold-corner tr"></div>
                        <div class="gold-corner bl"></div>
                        <div class="gold-corner br"></div>
                        <div class="registry-card-icon">
                            <span class="material-symbols-outlined" aria-hidden="true">phone_iphone</span>
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

    var modal = document.createElement('div');
    modal.id = 'calendar-modal-container';
    modal._icsUrl = icsUrl; // store so cerrarModalCalendario can revoke it
    modal.innerHTML = opciones;
    document.body.appendChild(modal);

    // Wire close button and backdrop — no inline handlers needed
    var _cmOverlay = document.getElementById('calendar-modal-overlay');
    var _cmContent = _cmOverlay ? _cmOverlay.querySelector('.gifts-modal-content') : null;
    var _cmCloseBtn = document.getElementById('calendar-modal-close-btn');

    if (_cmCloseBtn) {
        _cmCloseBtn.addEventListener('click', cerrarModalCalendario);
    }
    if (_cmContent) {
        _cmContent.addEventListener('click', function (e) { e.stopPropagation(); });
    }
    if (_cmOverlay) {
        _cmOverlay.addEventListener('click', function (e) {
            if (e.target === _cmOverlay) cerrarModalCalendario();
        });
    }
}

// Removes the calendar picker modal injected by agregarAlCalendario() and
// revokes the ICS Blob URL to avoid a memory leak.
function cerrarModalCalendario() {
    var modal = document.getElementById('calendar-modal-container');
    if (modal) {
        if (modal._icsUrl) {
            try { URL.revokeObjectURL(modal._icsUrl); } catch (_e) { }
        }
        modal.remove();
    }
}

// ============================================
// MAP WIDGET – TAB SWITCHING
// Clicking a .map-tab button swaps the visible Google Maps iframe
// and updates the bottom info bar (label, sublabel, directions link).
// ============================================
(function () {
    var tabs      = document.querySelectorAll('.map-tab');
    var allFrames = document.querySelectorAll('.map-frame-wrap iframe');
    var barLabel    = document.getElementById('bar-label');
    var barSublabel = document.getElementById('bar-sublabel');
    var barBtn      = document.getElementById('bar-btn');
    var barIcon     = document.getElementById('bar-icon');

    if (!tabs.length) return;

    tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            // Activate tab
            tabs.forEach(function (t) { t.classList.remove('active'); });
            tab.classList.add('active');

            // Show correct iframe — lazy-load it on first reveal
            allFrames.forEach(function (f) {
                var isTarget = f.id === tab.dataset.target;
                f.classList.toggle('visible', isTarget);
                // Hydrate data-src → src the first time the iframe becomes visible.
                // This prevents the hidden map from fetching ~300 KB of Maps JS on
                // page load before the user has ever opened that tab.
                if (isTarget && f.dataset.src && !f.src) {
                    f.src = f.dataset.src;
                    delete f.dataset.src;
                }
            });

            // Update bottom bar
            if (barLabel)    barLabel.textContent    = tab.dataset.label;
            if (barSublabel) barSublabel.textContent = tab.dataset.sublabel;
            if (barBtn) {
                barBtn.textContent = tab.dataset.btnText;
                barBtn.href        = tab.dataset.btnHref;
                barBtn.className   = 'map-btn-link';
            }
            if (barIcon) barIcon.className = 'map-icon ' + tab.dataset.iconClass;
        });
    });
}());


// Programmatically activates a map tab by its data-target value.
// Called from the event-card "Ver mapa" buttons in the HTML.
function activarMapTab(targetId) {
    var tab = document.querySelector('.map-tab[data-target="' + targetId + '"]');
    if (tab) tab.click();
}

// ============================================
// SMOOTH SCROLL
// Intercepts clicks on all anchor links (href="#...") and scrolls
// to the target element smoothly instead of jumping.
// Links with [data-map-tab] also activate the correct map tab before
// scrolling, so the tab state is set before the viewport moves.
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        // If the link carries a map-tab target, activate it first.
        var mapTab = this.getAttribute('data-map-tab');
        if (mapTab) {
            activarMapTab(mapTab);
        }
        var href = this.getAttribute('href');
        // Only proceed if href is not just '#' or empty
        if (href && href !== '#') {
            var target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
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
            .map(function (btn) { return btn.dataset.src; });
    }

    // Build lightbox DOM once
    var lb = document.createElement('div');
    lb.id = 'gallery-lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Visor de imágenes');
    lb.innerHTML = `
        <button class="lb-close" aria-label="Cerrar"><span class="material-symbols-outlined">close</span></button>
        <button class="lb-prev" aria-label="Anterior"><span class="material-symbols-outlined">chevron_left</span></button>
        <button class="lb-next" aria-label="Siguiente"><span class="material-symbols-outlined">chevron_right</span></button>
        <div class="lb-img-wrap"><img class="lb-img" src="" alt="Imagen galería"></div>
        <div class="lb-counter"></div>
    `;
    document.body.appendChild(lb);

    var lbImg     = lb.querySelector('.lb-img');
    var lbCounter = lb.querySelector('.lb-counter');
    var lbImages  = [];
    var lbIndex   = 0;
    var lbTouchStartX = 0;

    function lbOpen(index) {
        lbImages = getGalleryImages();
        lbIndex  = index;
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
        lbCounter.textContent = (lbIndex + 1) + ' / ' + lbImages.length;
        lb.querySelector('.lb-prev').style.display = lbImages.length > 1 ? '' : 'none';
        lb.querySelector('.lb-next').style.display = lbImages.length > 1 ? '' : 'none';
    }

    function lbPrev() { lbIndex = (lbIndex - 1 + lbImages.length) % lbImages.length; lbShow(); }
    function lbNext() { lbIndex = (lbIndex + 1) % lbImages.length; lbShow(); }

    // Delegate clicks on gallery buttons
    document.addEventListener('click', function (e) {
        var btn = e.target.closest('.gallery-item[data-src]');
        if (btn) {
            var srcs = getGalleryImages();
            var idx  = srcs.indexOf(btn.dataset.src);
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
        if (e.key === 'Escape')     lbClose();
        if (e.key === 'ArrowLeft')  lbPrev();
        if (e.key === 'ArrowRight') lbNext();
    });

    // Touch swipe
    lb.addEventListener('touchstart', function (e) { lbTouchStartX = e.changedTouches[0].screenX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
        var dx = e.changedTouches[0].screenX - lbTouchStartX;
        if (dx < -50) lbNext();
        if (dx >  50) lbPrev();
    });
}());

/* ============================================
   MUSIC PLAYER
   ============================================ */

// Playlist - add your MP3 files here
const playlist = [
    {
        title:  "How Deep Is Your Love",
        artist: "Bee Gees",
        src:    "mp3/How Deep Is Your Love - Bee Gees.mp3"
    },
    {
        title:  "Patadas de Ahogado",
        artist: "LATIN MAFIA",
        src:    "mp3/Patadas de Ahogado - LATIN MAFIA.mp3"
    },
    {
        title:  "Del Altar a la Tumba",
        artist: "José José",
        src:    "mp3/Del Altar a la Tumba - José José.mp3"
    },
    {
        title:  "Morfina",
        artist: "HUMBE",
        src:    "mp3/Morfina - HUMBE.mp3"
    },
    {
        title:  "Sólo Tú y Yo",
        artist: "José José",
        src:    "mp3/Sólo Tú y Yo - José José.mp3"
    },
    {
        title:  "Por Favor",
        artist: "HUMBE",
        src:    "mp3/Por Favor - HUMBE.mp3"
    },
];

let currentTrackIndex = 0;

const audioPlayer   = document.getElementById('audio-player');
const playPauseBtn  = document.getElementById('play-pause-btn');
const prevBtn       = document.getElementById('prev-btn');
const nextBtn       = document.getElementById('next-btn');
const trackTitle    = document.getElementById('track-title');
const trackArtist   = document.getElementById('track-artist');
const progressFill  = document.getElementById('progress-fill');
const currentTimeEl = document.getElementById('current-time');
const durationEl    = document.getElementById('duration');
const progressBar   = document.querySelector('#music-player-bar .mpb-progress-track');

function isAudioPlaying() {
    return !!(audioPlayer && !audioPlayer.paused && !audioPlayer.ended);
}

function syncPlayPauseUI() {
    if (!audioPlayer || !playPauseBtn) return;
    var icon = playPauseBtn.querySelector('.material-symbols-outlined');
    if (!icon) return;

    var playingNow = isAudioPlaying();
    icon.textContent = playingNow ? 'pause_circle' : 'play_circle';
    playPauseBtn.setAttribute('title',      playingNow ? 'Pausar' : 'Reproducir');
    playPauseBtn.setAttribute('aria-label', playingNow ? 'Pausar' : 'Reproducir');
}

// Loads a track's UI (title/artist) without fetching any audio bytes.
// The src is assigned lazily when the user first requests playback.
function loadTrack(index) {
    if (playlist.length === 0) {
        trackTitle.textContent  = "Sin canciones";
        trackArtist.textContent = "Agrega archivos MP3 a la carpeta 'mp3'";
        return;
    }

    var track = playlist[index];
    // Only update the src if the element already had one (i.e. playback was
    // in progress) so we don't trigger a network fetch on page load.
    if (audioPlayer.src && audioPlayer.src !== window.location.href) {
        audioPlayer.src = track.src;
        audioPlayer.load();
    }
    trackTitle.textContent  = track.title;
    trackArtist.textContent = track.artist;

    // Reset progress
    progressFill.style.width    = '0%';
    currentTimeEl.textContent   = '0:00';
}

// Toggles playback state. Assigns the src on first play if not yet set.
function togglePlayPause() {
    if (!audioPlayer || playlist.length === 0) return;

    // Lazy-load: assign src the first time the user presses play.
    if (!audioPlayer.src || audioPlayer.src === window.location.href) {
        audioPlayer.src = playlist[currentTrackIndex].src;
    }

    if (audioPlayer.paused || audioPlayer.ended) {
        var playPromise = audioPlayer.play();
        if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(function () { syncPlayPauseUI(); });
        }
    } else {
        audioPlayer.pause();
    }
}

// Internal helper: loads a track by index and optionally starts playback.
function _switchTrack(index, autoplay) {
    if (playlist.length === 0) return;
    currentTrackIndex = index;
    audioPlayer.src = playlist[currentTrackIndex].src;
    audioPlayer.load();
    trackTitle.textContent  = playlist[currentTrackIndex].title;
    trackArtist.textContent = playlist[currentTrackIndex].artist;
    progressFill.style.width  = '0%';
    currentTimeEl.textContent = '0:00';
    if (autoplay) {
        var playPromise = audioPlayer.play();
        if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(function () { syncPlayPauseUI(); });
        }
    }
}

// Moves to the previous track, wrapping around to the last track at the start.
function previousTrack(autoplay) {
    if (playlist.length === 0) return;
    var prevIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
    _switchTrack(prevIndex, autoplay);
}

// Moves to the next track, wrapping around to the first track at the end.
function nextTrack(autoplay) {
    if (playlist.length === 0) return;
    var nextIndex = (currentTrackIndex + 1) % playlist.length;
    _switchTrack(nextIndex, autoplay);
}

// Formats a duration in seconds as M:SS (e.g. 183 → "3:03").
function formatTime(seconds) {
    var mins = Math.floor(seconds / 60);
    var secs = Math.floor(seconds % 60);
    return mins + ':' + (secs < 10 ? '0' : '') + secs;
}

// ============================================
// MUSIC PLAYER – EVENT LISTENERS
// ============================================
if (audioPlayer) {
    audioPlayer.addEventListener('loadedmetadata', function () {
        durationEl.textContent = formatTime(audioPlayer.duration);
    });

    audioPlayer.addEventListener('timeupdate', function () {
        if (!isFinite(audioPlayer.duration) || audioPlayer.duration <= 0) return;
        var progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        progressFill.style.width  = progress + '%';
        currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
    });

    audioPlayer.addEventListener('ended', function () {
        nextTrack(true);
        syncPlayPauseUI();
    });

    audioPlayer.addEventListener('play',    syncPlayPauseUI);
    audioPlayer.addEventListener('pause',   syncPlayPauseUI);
    audioPlayer.addEventListener('playing', syncPlayPauseUI);
    audioPlayer.addEventListener('emptied', syncPlayPauseUI);

    if (progressBar) {
        progressBar.addEventListener('click', function (e) {
            if (playlist.length === 0) return;
            var rect       = progressBar.getBoundingClientRect();
            var clickX     = e.clientX - rect.left;
            var percentage = clickX / rect.width;
            audioPlayer.currentTime = percentage * audioPlayer.duration;
        });
    }
}

if (playPauseBtn) playPauseBtn.addEventListener('click', togglePlayPause);

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

// Load the first track's UI on startup — no network request until user plays.
if (playlist.length > 0) {
    loadTrack(currentTrackIndex);
    audioPlayer.volume = 0.8;
}

// Attempts to start music after the envelope animation completes.
function startMusicAfterEnvelope() {
    if (!audioPlayer || playlist.length === 0) return;

    if (!audioPlayer.src || audioPlayer.src === window.location.href) {
        audioPlayer.src = playlist[currentTrackIndex].src;
    }

    var playPromise = audioPlayer.play();
    if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(function () { syncPlayPauseUI(); });
    }
    syncPlayPauseUI();
}

// ============================================
// VOLUME CONTROL
// ============================================
var volumeSlider = document.getElementById('volume-slider');
var volumeBtn    = document.getElementById('volume-btn');
var lastVolume   = 0.8;

function updateVolumeIcon() {
    if (!volumeBtn) return;
    var icon = document.getElementById('vol-icon');
    if (!icon) return;

    var vol = audioPlayer ? audioPlayer.volume : 1;
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
        var vol = parseInt(this.value, 10) / 100;
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

if (audioPlayer) {
    audioPlayer.addEventListener('volumechange', function () {
        if (volumeSlider) volumeSlider.value = Math.round(audioPlayer.volume * 100);
        updateVolumeIcon();
    });
}

document.addEventListener('visibilitychange', syncPlayPauseUI);
window.addEventListener('pageshow',           syncPlayPauseUI);
window.addEventListener('focus',              syncPlayPauseUI);

// Fades the floating music player bar into view once the user scrolls 80 px down.
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
   PHOTO UPLOAD – GOOGLE APPS SCRIPT INTEGRATION
   ============================================ */

// Note: GALLERY_SCRIPT_URL is now stored dynamically via _rsvpStore.setGalleryScriptUrl()
// This allows it to be injected at runtime or changed without code modification

// Show selected file names
const photoFileInput = document.getElementById('photo-file');
const fileInfo       = document.getElementById('file-info');

if (photoFileInput && fileInfo) {
    photoFileInput.addEventListener('change', function () {
        var files = this.files;
        if (files.length > 0) {
            fileInfo.textContent = files.length === 1
                ? files[0].name
                : files.length + ' archivos seleccionados';
            fileInfo.style.color = '#2E8B57';
        } else {
            fileInfo.textContent = 'Ningún archivo seleccionado';
            fileInfo.style.color = '#999';
        }
    });
}

// Handle the photo upload form
const photoUploadForm       = document.getElementById('photo-upload-form');
const galleryGroupCodeInput = document.getElementById('gallery-group-code');

// Strict client-side validation to reduce non-image uploads.
const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const DISALLOWED_EXTENSIONS    = new Set(['svg']);

function getFileExtensionLower(name) {
    var parts = String(name || '').split('.');
    if (parts.length < 2) return '';
    return parts.pop().toLowerCase();
}

async function readFirstBytes(file, byteCount) {
    var slice  = file.slice(0, byteCount);
    var buffer = await slice.arrayBuffer();
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
    return bytes.length >= 6 &&
        bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38 &&
        (bytes[4] === 0x37 || bytes[4] === 0x39) && bytes[5] === 0x61;
}

function hasWebpMagic(bytes) {
    return bytes.length >= 12 &&
        bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
        bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
}

async function validateImageFile(file) {
    var extension = getFileExtensionLower(file.name);
    if (DISALLOWED_EXTENSIONS.has(extension) || String(file.type || '').toLowerCase() === 'image/svg+xml') {
        return { ok: false, reason: 'No se permiten archivos SVG.' };
    }

    var mime = String(file.type || '').toLowerCase();
    if (mime && !ALLOWED_IMAGE_MIME_TYPES.has(mime)) {
        return { ok: false, reason: 'Formato no permitido. Usa JPG, PNG, WEBP o GIF.' };
    }

    var bytes          = await readFirstBytes(file, 16);
    var looksLikeImage = hasJpegMagic(bytes) || hasPngMagic(bytes) || hasGifMagic(bytes) || hasWebpMagic(bytes);
    if (!looksLikeImage) {
        return { ok: false, reason: 'El archivo no parece ser una imagen válida.' };
    }

    return { ok: true };
}

if (photoUploadForm) {
    photoUploadForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        var guestName = document.getElementById('guest-name').value.trim();
        var groupCode = galleryGroupCodeInput ? String(galleryGroupCodeInput.value || '').trim() : '';
        var files     = photoFileInput.files;

        if (!guestName || !groupCode || files.length === 0) {
            _showInlineMsg('upload-alert', 'warning', 'Por favor, completa todos los campos.');
            return;
        }

        for (var file of files) {
            if (file.size > CONFIG.maxUploadBytes) {
                _showInlineMsg('upload-alert', 'warning', 'La foto "' + file.name + '" es demasiado grande. Tamaño máximo: ' + Math.round(CONFIG.maxUploadBytes / 1024 / 1024) + 'MB.');
                return;
            }
        }

        for (var file of files) {
            try {
                var result = await validateImageFile(file);
                if (!result.ok) {
                    _showInlineMsg('upload-alert', 'warning', '"' + file.name + '": ' + result.reason);
                    return;
                }
            } catch (err) {
                console.error('Error validando archivo:', err);
                _showInlineMsg('upload-alert', 'warning', 'No se pudo validar "' + file.name + '". Intenta con otra imagen.');
                return;
            }
        }

        uploadPhotosToGoogleDrive(guestName, groupCode, files);
    });
}

// Uploads one or more validated image files to Google Drive through the Apps Script.
async function uploadPhotosToGoogleDrive(guestName, groupCode, files) {
    var uploadBtn       = photoUploadForm.querySelector('button[type="submit"]');
    var originalBtnText = uploadBtn.innerHTML;

    var totalFiles = files.length;
    function _setUploadProgress(current, total) {
        uploadBtn.innerHTML = '<span class="material-symbols-outlined rotating">progress_activity</span> Subiendo ' + current + ' de ' + total + '...';
    }
    _setUploadProgress(1, totalFiles);
    uploadBtn.disabled = true;

    var uploadedCount    = 0;
    var failedCount      = 0;
    var failureMessages  = [];
    var galleryScriptUrl = _rsvpStore.getGalleryScriptUrl();

    for (var file of files) {
        var ext = getFileExtensionLower(file.name);
        if (ext === 'svg' || String(file.type || '').toLowerCase() === 'image/svg+xml') {
            failedCount++;
            continue;
        }

        try {
            var base64Data = await fileToBase64(file);

            // Upload with timeout and retry logic
            var uploadSuccess = false;
            var lastError = null;
            var maxRetries = 1; // Allow one retry on network failure
            
            for (var attempt = 0; attempt <= maxRetries; attempt++) {
                try {
                    var controller = new AbortController();
                    var timeoutId = setTimeout(function() { controller.abort(); }, 60000); // 60s timeout per upload
                    
                    var response = await fetch(galleryScriptUrl, {
                        method:   'POST',
                        headers:  { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
                        body:     new URLSearchParams({
                            action:    'uploadPhoto',
                            guestName: guestName,
                            groupCode: String(groupCode || ''),
                            photoData: base64Data,
                            fileName:  file.name,
                            section:   'invitados'
                        }),
                        signal:   controller.signal,
                        redirect: 'follow',
                        cache:    'no-store'
                    });
                    
                    clearTimeout(timeoutId);

                    var payload = null;
                    try { payload = await response.json(); } catch (_e) { }

                    if (!response.ok) {
                        throw new Error((payload && payload.message) ? payload.message : 'HTTP ' + response.status);
                    }
                    if (!payload || payload.success !== true) {
                        throw new Error((payload && payload.message) ? payload.message : 'Respuesta inválida del servidor');
                    }

                    uploadSuccess = true;
                    break; // Success, exit retry loop
                    
                } catch (error) {
                    clearTimeout(timeoutId);
                    lastError = error;
                    
                    // Retry on network/timeout errors, but not on validation errors
                    if (attempt < maxRetries && (error.name === 'AbortError' || error instanceof TypeError)) {
                        console.warn('Retry ' + (attempt + 1) + ' for ' + file.name + ' after: ' + error.message);
                        await new Promise(function(resolve) { setTimeout(resolve, 500); }); // Wait 500ms before retry
                        continue;
                    }
                    
                    throw error;
                }
            }
            
            if (!uploadSuccess && lastError) {
                throw lastError;
            }

            uploadedCount++;
            // Update the button label so the user sees file-by-file progress
            if (uploadedCount + failedCount < totalFiles) {
                _setUploadProgress(uploadedCount + failedCount + 1, totalFiles);
            }

        } catch (error) {
            console.error('Error subiendo ' + file.name + ':', error);
            failedCount++;
            var errorMsg = error && error.message ? error.message : 'Error desconocido';
            if (error && error.name === 'AbortError') {
                errorMsg = 'Tiempo de espera agotado (>60s)';
            }
            failureMessages.push(file.name + ': ' + errorMsg);
        }
    }

    uploadBtn.innerHTML = originalBtnText; // safe: restored from hardcoded initial HTML
    uploadBtn.disabled  = false;

    photoUploadForm.reset();
    if (fileInfo) {
        fileInfo.textContent  = 'Ningún archivo seleccionado';
        fileInfo.style.color  = '#999';
    }

    if (uploadedCount > 0) {
        _showInlineMsg('upload-alert', 'success', '¡Gracias por compartir tus fotos! 📸 ' + uploadedCount + ' foto(s) enviadas. Las fotos aparecerán en la galería después de ser aprobadas.');
        setTimeout(function () { 
            loadGuestPhotos();
        }, 2000);
        // Keep modal open for 4 seconds so user can see the message
        setTimeout(function () { closeUploadModal(); }, 4000);
    } else if (failedCount > 0) {
        var details = failureMessages.length ? '\n\nDetalle:\n- ' + failureMessages.join('\n- ') : '';
        _showInlineMsg('upload-alert', 'danger', 'Algunas fotos no se pudieron subir. Por favor, intenta de nuevo.' + details);
        console.error('Upload failed:', failedCount, 'photos failed');
        // Keep modal open for 4 seconds so user can see the error
        setTimeout(function () { closeUploadModal(); }, 4000);
    } else {
        // No files were uploaded
        closeUploadModal();
    }
}

// Reads a File object and returns its contents as a base64 data URL.
function fileToBase64(file) {
    return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.onload  = function () { resolve(reader.result); };
        reader.onerror = function (error) { reject(error); };
        reader.readAsDataURL(file);
    });
}

/* ============================================
   GUEST PHOTO GALLERY – POLAROID GRID
   ============================================ */
const POLAROID_INITIAL = 6;
let _allGuestPhotos = [];
let _visibleCount   = 0;

async function loadGuestPhotos() {
    var grid = document.getElementById('polaroid-grid');
    if (!grid) {
        return;
    }

    try {
        var response = await fetch(_rsvpStore.getGalleryScriptUrl() + '?action=getPhotos&section=invitados');
        
        var data     = await response.json();

        if (data.success && data.photos && data.photos.length > 0) {
            _allGuestPhotos = data.photos;
            _visibleCount   = 0;
            grid.innerHTML  = '';
            var old = document.getElementById('polaroid-more-wrap');
            if (old) old.remove();

            await _renderPolaroidBatch(grid, POLAROID_INITIAL);
        }
    } catch (error) {
        console.error('Error cargando fotos:', error);
    }
}

async function _renderPolaroidBatch(grid, count) {
    var batch = _allGuestPhotos.slice(_visibleCount, _visibleCount + count);
    if (batch.length === 0) return;

    var startIdx = _visibleCount;

    batch.forEach(function (photo, i) {
        var index  = startIdx + i;
        var fileId = String(photo.fileId || '').trim();
        // Build polaroid card via DOM API to avoid XSS from server-supplied fileId / guestName
        var card = document.createElement('div');
        card.className = 'polaroid-card';
        card.dataset.fileId = fileId;    // dataset assignment is always safe — no HTML parsing
        card.dataset.index  = String(index);
        card.addEventListener('click', function () { openPhotoLightbox(this); });

        var photoDiv = document.createElement('div');
        photoDiv.className = 'polaroid-photo';

        var img = document.createElement('img');
        img.dataset.fileId = fileId;
        img.src     = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
        img.alt     = 'Foto de ' + String(photo.guestName || '');  // textContent-equivalent
        img.loading = 'lazy';
        photoDiv.appendChild(img);

        var captionDiv = document.createElement('div');
        captionDiv.className = 'polaroid-caption';
        var authorP = document.createElement('p');
        authorP.className   = 'polaroid-author';
        authorP.textContent = String(photo.guestName || '');        // textContent — XSS-safe
        captionDiv.appendChild(authorP);

        card.appendChild(photoDiv);
        card.appendChild(captionDiv);
        grid.appendChild(card);
    });

    _visibleCount += batch.length;

    var allCards = grid.querySelectorAll('.polaroid-card');
    var newCards = Array.from(allCards).slice(startIdx);
    await Promise.all(newCards.map(async function (card) {
        var img    = card.querySelector('img[data-file-id]');
        var fileId = img ? img.getAttribute('data-file-id') : null;
        if (!fileId) return;
        try {
            var dataUrl = await fetchGalleryImageDataUrl(fileId);
            img.src = dataUrl;
        } catch (e) {
            console.error('Error cargando imagen:', e);
            var wrap = img.closest('.polaroid-photo');
            if (wrap) wrap.style.cssText = 'display:flex;align-items:center;justify-content:center;color:#aaa;font-size:12px';
        }
    }));

    _updatePolaroidButton(grid);
}

function _updatePolaroidButton(grid) {
    var moreWrap = document.getElementById('polaroid-more-wrap');
    var total    = _allGuestPhotos.length;

    if (total <= POLAROID_INITIAL) {
        if (moreWrap) moreWrap.remove();
        return;
    }

    if (!moreWrap) {
        moreWrap = document.createElement('div');
        moreWrap.id        = 'polaroid-more-wrap';
        moreWrap.className = 'polaroid-more-wrap';
        grid.insertAdjacentElement('afterend', moreWrap);
    }

    // Build the button via DOM API — no onclick= attribute, CSP-safe
    moreWrap.innerHTML = '';
    var _moreBtn = document.createElement('button');
    _moreBtn.className = 'polaroid-more-btn';
    var _moreBtnIcon = document.createElement('span');
    _moreBtnIcon.className = 'material-symbols-outlined';

    if (_visibleCount < total) {
        var remaining = total - _visibleCount;
        _moreBtn.appendChild(document.createTextNode('Ver más fotos (' + remaining + ')'));
        _moreBtnIcon.textContent = 'expand_more';
        _moreBtn.appendChild(_moreBtnIcon);
        _moreBtn.addEventListener('click', loadMorePolaroids);
    } else {
        _moreBtn.appendChild(document.createTextNode('Ver menos fotos'));
        _moreBtnIcon.textContent = 'expand_less';
        _moreBtn.appendChild(_moreBtnIcon);
        _moreBtn.addEventListener('click', collapsePolaroids);
    }
    moreWrap.appendChild(_moreBtn);
}

async function loadMorePolaroids() {
    var grid = document.getElementById('polaroid-grid');
    if (!grid) return;
    var remaining = _allGuestPhotos.length - _visibleCount;
    if (remaining > 0) await _renderPolaroidBatch(grid, remaining);
}

function collapsePolaroids() {
    var grid = document.getElementById('polaroid-grid');
    if (!grid) return;

    var cards = grid.querySelectorAll('.polaroid-card');
    Array.from(cards).slice(POLAROID_INITIAL).forEach(function (card) { card.remove(); });
    _visibleCount = POLAROID_INITIAL;

    _updatePolaroidButton(grid);
    grid.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

var _lightboxTrapCleanup = null;
function openPhotoLightbox(card) {
    var img = card ? card.querySelector('img') : null;
    if (!img || !img.src || img.src.includes('R0lGODlh')) return;
    var lightbox = document.getElementById('photo-lightbox');
    if (!lightbox) return;
    var author = card.querySelector('.polaroid-author');
    var authorName = author ? author.textContent.trim() : '';
    var lbImg = document.getElementById('lightbox-img');
    lbImg.src = img.src;
    // Set meaningful alt text so screen readers describe the photo
    lbImg.alt = authorName ? ('Foto de ' + authorName) : 'Foto de invitado';
    document.getElementById('lightbox-caption').textContent = authorName;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
    // Move focus to the close button and trap it inside
    var closeBtn = document.getElementById('lightbox-close-btn');
    if (closeBtn) closeBtn.focus();
    if (_lightboxTrapCleanup) _lightboxTrapCleanup();
    _lightboxTrapCleanup = _trapFocus(lightbox);
}

function closePhotoLightbox() {
    var lightbox = document.getElementById('photo-lightbox');
    if (!lightbox) return;
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
    if (_lightboxTrapCleanup) { _lightboxTrapCleanup(); _lightboxTrapCleanup = null; }
}

const __galleryImageCache = new Map();

async function fetchGalleryImageDataUrl(fileId) {
    var key = String(fileId || '').trim();
    if (__galleryImageCache.has(key)) {
        return __galleryImageCache.get(key);
    }

    var url  = _rsvpStore.getGalleryScriptUrl() + '?action=getPhoto&fileId=' + encodeURIComponent(key);
    var resp = await fetch(url);
    var json = await resp.json();
    if (!json || !json.success) {
        throw new Error((json && json.message) ? json.message : 'No se pudo cargar la imagen');
    }
    var contentType = String(json.contentType || 'image/jpeg');
    var base64      = String(json.base64 || '');
    var dataUrl     = 'data:' + contentType + ';base64,' + base64;
    __galleryImageCache.set(key, dataUrl);
    return dataUrl;
}

function closeRsvpModal() {
    var modal = document.getElementById('rsvp-modal');
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
    // Return focus to the confirm button so the keyboard user is not lost
    var trigger = document.getElementById('confirm-attendance-btn');
    if (trigger) trigger.focus();
}

var _uploadModalCleanup = null;
function openUploadModal() {
    var modal = document.getElementById('upload-modal');
    if (!modal) return;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    // Move focus into the modal so screen readers announce the dialog
    var heading = document.getElementById('upload-modal-title');
    if (heading) heading.focus();
    // Activate focus trap
    if (_uploadModalCleanup) _uploadModalCleanup();
    _uploadModalCleanup = _trapFocus(modal);
}

function closeUploadModal() {
    var modal = document.getElementById('upload-modal');
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
    if (_uploadModalCleanup) { _uploadModalCleanup(); _uploadModalCleanup = null; }
    // Return focus to the trigger that opened the modal
    var trigger = document.getElementById('upload-trigger-btn');
    if (trigger) trigger.focus();
}

// ============================================
// DOMContentLoaded – consolidated post-parse setup
// ============================================
document.addEventListener('DOMContentLoaded', function () {
    // 1. Load guest photos after a short delay to avoid blocking initial render
    setTimeout(function () { loadGuestPhotos(); }, 1000);

    // 2. Close RSVP modal when clicking the backdrop
    var rsvpModal = document.getElementById('rsvp-modal');
    if (rsvpModal) {
        rsvpModal.addEventListener('click', function (e) {
            if (e.target === rsvpModal) closeRsvpModal();
        });
    }

    // 3. Close any open modal with the Escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeRsvpModal();
            closeUploadModal();
            closePhotoLightbox();
        }
    });
});

/* ============================================
   ENVELOPE ANIMATION
   Three-phase sequence:
     1. Flap opens (CSS animation, 1.2 s)
     2. Envelope fades out along with the overlay (1.8 s)
     3. Overlay is hidden and music starts
   ============================================ */
function openInvitation() {
    var envelope = document.getElementById('main-envelope');
    var overlay  = document.getElementById('intro-overlay');
    var wrapper  = document.getElementById('envelope-wrapper');
    var prompt   = document.getElementById('open-prompt');

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
            overlay.style.display    = 'none';
            document.body.classList.remove('envelope-visible');

            if (typeof startMusicAfterEnvelope === 'function') {
                startMusicAfterEnvelope();
            }
        }, 1800);
    }, 1200);
}
