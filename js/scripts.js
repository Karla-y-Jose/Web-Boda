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
    $('.nav-toggle').click(function () {
        $(this).toggleClass('active');
        $('.header-nav').toggleClass('open');
        event.preventDefault();
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
    // IMPORTANTE: Reemplaza esta URL con la URL de tu Apps Script desplegado
    var RSVP_ENDPOINT = 'https://script.google.com/macros/s/AKfycbziecc4wpBgW48ozxnbT29bJT-Qu1IKnbjKuRzmBb0WYGEuCvzk0wCJjAYlUI4aI6ZQMg/exec';
    
    var currentGuests = [];

    // Buscar invitado por nombre
    $('#rsvp-search-form').on('submit', function(e) {
        e.preventDefault();
        var searchName = $('#rsvp-search-name').val().trim();
        var $btn = $(this).find('button[type="submit"]');
        
        if (!searchName) {
            $('#alert-wrapper').html(alert_markup('warning', 'Por favor ingresa tu nombre.'));
            return;
        }
        
        $('#alert-wrapper').html(alert_markup('info', '<strong>Buscando...</strong> Por favor espera.'));
        $btn.prop('disabled', true);
        
        // Usar GET con parámetros en la URL para evitar problemas de CORS
        $.ajax({
            url: RSVP_ENDPOINT + '?action=searchGuest&name=' + encodeURIComponent(searchName),
            method: 'GET',
            dataType: 'json'
        })
        .done(function(response) {
            console.log('Search Response:', response);
            
            if (response.result === 'success') {
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

    // Mostrar lista de invitados
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

    // Confirmar asistencias
    $('#confirm-attendance-btn').on('click', function() {
        var $btn = $(this);
        var updates = [];
        
        $('.guest-item').each(function(index) {
            var rowIndex = $(this).data('row-index');
            var selectedState = $(this).find('input[type="radio"]:checked').val();
            
            updates.push({
                rowIndex: rowIndex,
                estado: selectedState
            });
        });
        
        $('#confirm-alert-wrapper').html(alert_markup('info', '<strong>Guardando...</strong> Por favor espera.'));
        $btn.prop('disabled', true);
        
        // Convertir updates a string JSON y codificarlo para URL
        var updatesJson = encodeURIComponent(JSON.stringify(updates));
        
        $.ajax({
            url: RSVP_ENDPOINT + '?action=updateAttendance&updates=' + updatesJson,
            method: 'GET',
            dataType: 'json'
        })
        .done(function(response) {
            console.log('Update Response:', response);
            
            if (response.result === 'success') {
                $('#confirm-alert-wrapper').html(alert_markup('success', '<strong>¡Listo!</strong> ' + response.message));
                
                // Mostrar modal de confirmación
                setTimeout(function() {
                    $('#rsvp-modal').addClass('active');
                    
                    // Agregar botones de calendario con la misma funcionalidad de la sección de eventos
                    var calendarButtons = `
                        <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 20px;">
                            <button onclick="agregarAlCalendario('Boda Karla & Jose', 'Ceremonia: Parroquia Nuestra Señora de Altagracia, Zapopan, Jal. | Recepción: Jardin de Eventos Andira, Nuevo México, Jal.', '20261218T180000', '20261219T020000')" 
                                    class="btn btn-fill calendar-btn-modal" 
                                    style="width: 100%;">
                                <i class="fa fa-calendar" style="margin-right: 8px;"></i> Añadir al Calendario
                            </button>
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

    // Volver a búsqueda
    $('#back-to-search-btn').on('click', function() {
        $('#rsvp-guest-list').hide();
        $('#rsvp-search-container').show();
        $('#rsvp-search-name').val('');
        $('#alert-wrapper').html('');
        $('#confirm-alert-wrapper').html('');
    });
     
    // Helper function for alert markup (Rampatra style)
    function alert_markup(type, message) {
        var alertClass = 'alert-info';
        if (type === 'success') alertClass = 'alert-success';
        if (type === 'danger') alertClass = 'alert-danger';
        if (type === 'warning') alertClass = 'alert-warning';
        
        return '<div class="alert ' + alertClass + '" style="margin-top: 15px;">' + message + '</div>';
    }
    
    // Helper function for alert markup (Rampatra style)
     function alert_markup(alert_type, msg) {
         return '<div class="alert alert-' + alert_type + '" role="alert" style="margin-bottom: 20px;">' 
                + msg + 
                '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span>&times;</span></button></div>';
     }

    // ========== Bootstrap Modal Plugin ==========
    $(document).on('click', '[data-dismiss="modal"]', function() {
        var modal = $(this).closest('.modal');
        modal.fadeOut(300, function() {
            modal.removeClass('in show');
        });
    });

    $(document).on('click', '.modal', function(e) {
        if (e.target === this) {
            $(this).fadeOut(300, function() {
                $(this).removeClass('in show');
            });
        }
    });
});

// Show Custom Alert Messages
function showAlert(type, message) {
    var alertClass = 'alert alert-' + type;
    var alertHTML = '<div class="' + alertClass + '" style="padding: 15px; margin-bottom: 20px; border-radius: 4px; display: none;">';
    
    if (type === 'success') {
        alertHTML += '<i class="fa fa-check"></i> ' + message;
        alertHTML += '</div>';
        var $alert = $(alertHTML);
        $alert.css({
            'background-color': '#d4f1d4',
            'color': '#155724',
            'border': '1px solid #c3e6c3'
        });
    } else if (type === 'warning') {
        alertHTML += '<i class="fa fa-exclamation-triangle"></i> ' + message;
        alertHTML += '</div>';
        var $alert = $(alertHTML);
        $alert.css({
            'background-color': '#fff3cd',
            'color': '#856404',
            'border': '1px solid #ffeaa7'
        });
    } else {
        alertHTML += '<i class="fa fa-times-circle"></i> ' + message;
        alertHTML += '</div>';
        var $alert = $(alertHTML);
        $alert.css({
            'background-color': '#f8d7da',
            'color': '#721c24',
            'border': '1px solid #f5c6cb'
        });
    }

    $('#alert-wrapper').html($alert);
    $alert.slideDown(300);

    setTimeout(function() {
        $alert.slideUp(300, function() { $alert.remove(); });
    }, 4000);
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
    
    // Generar archivo ICS para Apple Calendar
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
                    <!-- Opción Google Calendar -->
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

                    <!-- Opción Apple Calendar -->
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
    
    // Cerrar al hacer clic en el overlay
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

    // Track last selected destination for the "Cómo llegar" button
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

        // IMPORTANT: You asked to request location permission first, then open Google Maps.
        // Browsers may block opening a *new tab* after the permission prompt (not a direct user gesture),
        // so we navigate in the same tab for reliable one-click behavior.
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

// Bootstrap Modal Support
$.fn.modal = function(action) {
    if (action === 'show') {
        this.fadeIn(300);
        this.addClass('in show');
    } else if (action === 'hide') {
        this.fadeOut(300, function() {
            $(this).removeClass('in show');
        });
    }
    return this;
};

/* ============================================
   MUSIC PLAYER
   ============================================ */

// Lista de canciones - Agrega tus archivos MP3 aquí
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
let isPlaying = false;

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
    isPlaying = playingNow;
    icon.classList.toggle('fa-play', !playingNow);
    icon.classList.toggle('fa-pause', playingNow);
    playPauseBtn.setAttribute('title', playingNow ? 'Pausar' : 'Reproducir');
    playPauseBtn.setAttribute('aria-label', playingNow ? 'Pausar' : 'Reproducir');
}

// Función para cargar una canción
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

// Función para reproducir/pausar
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

// Función para canción anterior
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

// Función para siguiente canción
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

// Función para formatear tiempo
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// Event Listeners
if (audioPlayer) {
    // Cuando se puede reproducir
    audioPlayer.addEventListener('loadedmetadata', function() {
        durationEl.textContent = formatTime(audioPlayer.duration);
    });

    // Actualizar progreso
    audioPlayer.addEventListener('timeupdate', function() {
        if (!isFinite(audioPlayer.duration) || audioPlayer.duration <= 0) return;
        const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        progressFill.style.width = progress + '%';
        currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
    });

    // Cuando termina la canción
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

    // Click en barra de progreso
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

// Botones de control
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

// Cargar primera canción al inicio y reproducir automáticamente
if (playlist.length > 0) {
    loadTrack(currentTrackIndex);
    
    let musicStarted = false;
    let scrollDetected = false;
    
    // Crear overlay invisible y notificación
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
    
    // Función para reproducir la música
    function startMusic() {
        if (musicStarted) return;
        
        console.log('🎵 Iniciando música...');
        
        const playPromise = audioPlayer.play();
        
        if (playPromise !== undefined) {
            playPromise.then(function() {
                // Reproducción exitosa
                musicStarted = true;
                syncPlayPauseUI();
                console.log('✅ Música reproduciéndose');
                
                // Ocultar overlay y notificación
                musicOverlay.style.display = 'none';
                document.getElementById('music-notif-content').style.display = 'none';
                
                // Remover event listeners
                window.removeEventListener('scroll', scrollHandler);
                musicOverlay.removeEventListener('click', startMusic);
                musicOverlay.removeEventListener('touchstart', startMusic);
                document.getElementById('music-notif-content').removeEventListener('click', startMusic);
                document.getElementById('music-notif-content').removeEventListener('touchstart', startMusic);
            }).catch(function(error) {
                console.log('⚠️ No se pudo reproducir:', error.message);
                syncPlayPauseUI();
            });
        }
    }
    
    // Handler para scroll - muestra la notificación
    function scrollHandler() {
        if (musicStarted || scrollDetected) return;
        
        const scrolled = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrolled > 50) {
            scrollDetected = true;
            console.log('📜 Scroll detectado - mostrando notificación');
            
            // Mostrar overlay y notificación
            musicOverlay.style.display = 'block';
            document.getElementById('music-notif-content').style.display = 'block';
            
            // Hacer la notificación clickeable directamente
            const notifContent = document.getElementById('music-notif-content');
            notifContent.addEventListener('click', startMusic);
            notifContent.addEventListener('touchstart', startMusic, { passive: true });
            
            // El overlay también captura clicks fuera de la notificación
            musicOverlay.addEventListener('click', startMusic);
            musicOverlay.addEventListener('touchstart', startMusic, { passive: true });
        }
    }
    
    // Event listener para scroll
    window.addEventListener('scroll', scrollHandler, { passive: true });
}

// Extra safety: resync button state after returning to the page/tab.
document.addEventListener('visibilitychange', syncPlayPauseUI);
window.addEventListener('pageshow', syncPlayPauseUI);
window.addEventListener('focus', syncPlayPauseUI);
/* ============================================
   FUNCIONALIDAD DE SUBIDA DE FOTOS - GOOGLE APPS SCRIPT
   ============================================ */

// ⚠️ IMPORTANTE: Reemplaza esta URL con la URL de tu Google Apps Script
const GALLERY_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwpDRH3XHlD29XuLAjU6N_8BVso02PnYhyIhFCSlysJpQPKZMIhglesHvUGj83sOKI_/exec';

// Mostrar nombre de archivos seleccionados
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

// Manejar el formulario de subida de fotos
const photoUploadForm = document.getElementById('photo-upload-form');

// Validación estricta (cliente) para reducir uploads no-imagen.
// Nota: la validación real también ocurre en Apps Script.
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

    // Algunos navegadores pueden mandar type vacío; validamos por firma (magic bytes).
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
        
        // Validar tamaño de archivos (máximo 5MB por foto)
        for (let file of files) {
            if (file.size > 5 * 1024 * 1024) {
                alert(`La foto "${file.name}" es demasiado grande. Tamaño máximo: 5MB`);
                return;
            }
        }

        // Validación estricta (MIME/extensión/firma)
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
        
        // Subir fotos a Google Apps Script
        uploadPhotosToGoogleDrive(guestName, files);
    });
}

/**
 * Subir fotos a Google Drive a través de Google Apps Script
 */
async function uploadPhotosToGoogleDrive(guestName, files) {
    const uploadBtn = photoUploadForm.querySelector('button[type="submit"]');
    const originalBtnText = uploadBtn.innerHTML;
    
    uploadBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Subiendo...';
    uploadBtn.disabled = true;
    
    let uploadedCount = 0;
    let failedCount = 0;
    
    // Procesar cada archivo
    for (let file of files) {
        // Defensa extra (ya se validó antes del submit)
        const ext = getFileExtensionLower(file.name);
        if (ext === 'svg' || String(file.type || '').toLowerCase() === 'image/svg+xml') {
            console.log(`Archivo ${file.name} es SVG, se omite`);
            failedCount++;
            continue;
        }
        
        try {
            // Convertir archivo a base64
            const base64Data = await fileToBase64(file);
            
            // Enviar a Google Apps Script
            const response = await fetch(GALLERY_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors', // Importante para Google Apps Script
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
            
            // Nota: Con mode: 'no-cors', no podemos leer la respuesta
            // Asumimos que fue exitoso si no hubo error
            uploadedCount++;
            console.log(`✅ Foto ${file.name} subida exitosamente`);
            
        } catch (error) {
            console.error(`❌ Error subiendo ${file.name}:`, error);
            failedCount++;
        }
    }
    
    // Restaurar botón
    uploadBtn.innerHTML = originalBtnText;
    uploadBtn.disabled = false;
    
    // Resetear formulario
    photoUploadForm.reset();
    fileInfo.textContent = 'Ningún archivo seleccionado';
    fileInfo.style.color = '#999';
    
    // Mostrar resultado
    if (uploadedCount > 0) {
        alert(`¡Gracias por compartir tus fotos! 📸\n\n${uploadedCount} foto(s) se enviaron correctamente.\n\nNota: Por seguridad, las fotos se mostrarán en la galería después de ser aprobadas.`);
        
        // Recargar galería después de 2 segundos
        setTimeout(() => {
            loadGuestPhotos();
        }, 2000);
    }
    
    if (failedCount > 0) {
        alert(`Algunas fotos no se pudieron subir. Por favor, intenta de nuevo.`);
    }
}

/**
 * Convertir archivo a base64
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
 * Cargar fotos de invitados desde Google Drive y mostrar en carrusel
 */
async function loadGuestPhotos() {
    const carouselTrack = document.getElementById('carousel-track');
    
    if (!carouselTrack) return;
    
    try {
        const response = await fetch(`${GALLERY_SCRIPT_URL}?action=getPhotos&section=invitados`);
        const data = await response.json();
        
        if (data.success && data.photos && data.photos.length > 0) {
            // Limpiar mensaje de "no hay fotos"
            const noPhotosMsg = carouselTrack.querySelector('.no-photos-carousel');
            if (noPhotosMsg) {
                noPhotosMsg.remove();
            }
            
            // Limpiar fotos existentes
            carouselTrack.innerHTML = '';
            
            // Agregar cada foto al carrusel
            data.photos.forEach((photo, index) => {
                // Convertir URL a formato que funcione en img tag
                const imageUrl = convertDriveUrl(photo.url);
                
                // Formatear fecha
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
            
            // Actualizar contador
            document.getElementById('total-photos').textContent = data.photos.length;
            document.getElementById('carousel-counter').style.display = 'block';
            
            // Mostrar controles si hay más de una foto
            if (data.photos.length > 1) {
                document.getElementById('carousel-prev').style.display = 'flex';
                document.getElementById('carousel-next').style.display = 'flex';
            }
            
            // Inicializar carrusel
            initializeCarousel(data.photos.length);
            
            console.log(`✅ ${data.photos.length} fotos cargadas en el carrusel`);
        }
    } catch (error) {
        console.error('Error cargando fotos:', error);
    }
}

/**
 * Inicializar funcionalidad del carrusel
 */
let currentSlide = 0;
let totalSlides = 0;

function initializeCarousel(total) {
    totalSlides = total;
    currentSlide = 0;
    updateCarousel();
    
    // Event listeners para los controles
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
    
    // Soporte para gestos táctiles (swipe)
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
            // Swipe left - siguiente
            currentSlide++;
            updateCarousel();
        }
        if (touchEndX > touchStartX + 50 && currentSlide > 0) {
            // Swipe right - anterior
            currentSlide--;
            updateCarousel();
        }
    }
    
    // Soporte para teclado (flechas)
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
 * Convertir URL de Google Drive al formato correcto para mostrar en img
 */
function convertDriveUrl(url) {
    // Si ya está en el formato correcto, devolverla
    if (url.includes('googleusercontent.com')) {
        return url;
    }
    
    // Extraer el file ID de diferentes formatos de URL de Drive
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
    
    // Si encontramos el ID, convertir a formato que funcione en img
    if (fileId) {
        return `https://lh3.googleusercontent.com/d/${fileId}=s4000?authuser=0`;
    }
    
    // Si no pudimos convertir, devolver la URL original
    return url;
}

// Cargar fotos al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    // Esperar 1 segundo antes de cargar fotos
    setTimeout(() => {
        loadGuestPhotos();
    }, 1000);
});

/* ============================================
   MODAL DE MESAS DE REGALOS
   ============================================ */

function openGiftsModal() {
    const modal = document.getElementById('gifts-modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevenir scroll del body
    }
}

function closeGiftsModal() {
    const modal = document.getElementById('gifts-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Restaurar scroll
    }
}

function closeRsvpModal() {
    const modal = document.getElementById('rsvp-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Restaurar scroll
    }
}

// Cerrar modal al hacer click fuera del contenido
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
    
    // Cerrar modales con tecla Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeGiftsModal();
            closeRsvpModal();
        }
    });
});