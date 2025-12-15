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
    var RSVP_ENDPOINT = 'https://script.google.com/macros/s/AKfycbw01xJ0LhxySesqIzJgKgL4kcAz46AxuiVbKCspIsqpQtHt-vXE0dbkFmSuPmvrFUgaDA/exec';
    
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
        
        $.ajax({
            url: RSVP_ENDPOINT,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                action: 'searchGuest',
                name: searchName
            })
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
        
        $.ajax({
            url: RSVP_ENDPOINT,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                action: 'updateAttendance',
                updates: updates
            })
        })
        .done(function(response) {
            console.log('Update Response:', response);
            
            if (response.result === 'success') {
                $('#confirm-alert-wrapper').html(alert_markup('success', '<strong>¡Listo!</strong> ' + response.message));
                
                // Mostrar modal de confirmación
                setTimeout(function() {
                    $('#rsvp-modal').modal('show');
                    
                    // Add calendar button
                    var calendarBtn = '<a href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=Boda%20de%20Karla%20%26%20Jose&dates=20261218T180000/20261218T230000&location=Zapopan,%20Jalisco" target="_blank" class="btn btn-fill" style="background:#d4af37; color:#fff; padding:10px 20px; margin-top:10px; display:inline-block; text-decoration:none; border-radius:4px;">📅 Agregar al Calendario</a>';
                    $('#add-to-cal').html(calendarBtn);
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
        <div id="calendar-modal-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                                             background: rgba(0,0,0,0.6); z-index: 9998; cursor: pointer; 
                                             backdrop-filter: blur(2px); animation: fadeIn 0.3s ease;">
            <div onclick="event.stopPropagation()" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                        background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%); padding: 40px; border-radius: 16px; 
                        box-shadow: 0 10px 40px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05); z-index: 9999; text-align: center; 
                        min-width: 340px; max-width: 420px; animation: slideIn 0.3s ease;">
                <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid rgba(0,0,0,0.08);">
                    <div style="background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%); 
                                border-radius: 50%; width: 50px; height: 50px; display: flex; align-items: center; 
                                justify-content: center; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3); flex-shrink: 0;">
                        <i class="fa fa-calendar" style="color: #fff; font-size: 24px;"></i>
                    </div>
                    <h2 style="margin: 0; color: #2c3e50; font-family: 'Didot', serif; font-size: 24px; font-weight: 400; letter-spacing: 0.5px;">Agregar al Calendario</h2>
                </div>
                <div style="display: flex; flex-direction: column; gap: 14px;">
                    <a href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodedTitulo}&dates=${inicio}/${fin}&location=${encodedUbicacion}"
                       target="_blank" 
                       class="calendar-modal-btn-gold"
                       style="padding: 16px 24px; background: #d4af37; color: #2E8B57; text-decoration: none; 
                           border: 2px solid #d4af37; border-radius: 8px; font-weight: 600; cursor: pointer; 
                           transition: all 0.3s ease; font-size: 15px; display: flex; align-items: center; 
                           justify-content: center; letter-spacing: 0.3px;">
                       <i class="fa fa-google calendar-icon" style="color: #2E8B57; margin-right: 10px; font-size: 18px; transition: all 0.3s ease;"></i>Google Calendar
                    </a>
                    <a href="${icsUrl}" download="evento-boda.ics"
                       class="calendar-modal-btn-gold"
                       style="padding: 16px 24px; background: #d4af37; color: #2E8B57; text-decoration: none; 
                           border: 2px solid #d4af37; border-radius: 8px; font-weight: 600; cursor: pointer; 
                           transition: all 0.3s ease; font-size: 15px; display: flex; align-items: center; 
                           justify-content: center; letter-spacing: 0.3px;">
                       <i class="fa fa-apple calendar-icon" style="color: #2E8B57; margin-right: 10px; font-size: 18px; transition: all 0.3s ease;"></i>Apple Calendar
                    </a>
                    <button onclick="cerrarModalCalendario()" class="calendar-modal-btn-green"
                            style="padding: 14px 24px; background: #2E8B57; color: #fff; 
                            border: 2px solid #2E8B57; border-radius: 8px; font-weight: 600; cursor: pointer; 
                            transition: all 0.3s ease; font-size: 14px; margin-top: 10px; letter-spacing: 0.3px;">
                       Cerrar
                    </button>
                </div>
            </div>
        </div>
        <style>
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideIn {
                from { opacity: 0; transform: translate(-50%, -45%); }
                to { opacity: 1; transform: translate(-50%, -50%); }
            }
        </style>
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

// Google Map Integration
function initMap() {
    // Check if map element exists
    if (!document.getElementById('map-canvas')) {
        console.warn('Map container element not found');
        return;
    }

    // Check if Google Maps is available
    if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
        console.warn('Google Maps library not loaded');
        return;
    }

    // Center map between both venues
    var centerLocation = {lat: 20.761404, lng: -103.4241881};
    
    var map = new google.maps.Map(document.getElementById('map-canvas'), {
        zoom: 12,
        center: centerLocation,
        scrollwheel: false,
        styles: [
            {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }]
            }
        ]
    });

    // Ceremony marker
    var ceremonyMarker = new google.maps.Marker({
        position: {lat: 20.744395, lng: -103.3928862},
        map: map,
        title: 'Ceremonia - Parroquia Nuestra Señora de Altagracia',
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#d4af37',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3
        }
    });

    // Reception marker
    var receptionMarker = new google.maps.Marker({
        position: {lat: 20.7784148, lng: -103.4550886},
        map: map,
        title: 'Recepción - Jardin de Eventos Andira',
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#2E8B57',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3
        }
    });

    // Info windows
    var ceremonyInfo = new google.maps.InfoWindow({
        content: '<div style="font-family: Montserrat, sans-serif; text-align: center; padding: 10px;">' +
                '<strong style="color: #d4af37; font-size: 14px;">Ceremonia</strong><br>' +
                '<span style="color: #666; font-size: 12px;">Parroquia Nuestra Señora de Altagracia</span><br>' +
                '<span style="color: #666; font-size: 11px;">6:00 PM</span></div>'
    });

    var receptionInfo = new google.maps.InfoWindow({
        content: '<div style="font-family: Montserrat, sans-serif; text-align: center; padding: 10px;">' +
                '<strong style="color: #2E8B57; font-size: 14px;">Recepción</strong><br>' +
                '<span style="color: #666; font-size: 12px;">Jardin de Eventos Andira</span><br>' +
                '<span style="color: #666; font-size: 11px;">8:00 PM</span></div>'
    });

    ceremonyMarker.addListener('click', function() {
        receptionInfo.close();
        ceremonyInfo.open(map, ceremonyMarker);
    });

    receptionMarker.addListener('click', function() {
        ceremonyInfo.close();
        receptionInfo.open(map, receptionMarker);
    });

    // Toggle map content buttons
    $('#btn-show-map-ceremony').click(function () {
        $('#map-content').toggleClass('toggle-map-content');
        $('#btn-show-content').toggleClass('toggle-map-content');
        map.setCenter({lat: 20.744395, lng: -103.3928862});
        map.setZoom(15);
        ceremonyInfo.open(map, ceremonyMarker);
    });

    $('#btn-show-map-reception').click(function () {
        $('#map-content').toggleClass('toggle-map-content');
        $('#btn-show-content').toggleClass('toggle-map-content');
        map.setCenter({lat: 20.7784148, lng: -103.4550886});
        map.setZoom(15);
        receptionInfo.open(map, receptionMarker);
    });

    $('#btn-show-content').click(function () {
        $('#map-content').toggleClass('toggle-map-content');
        $('#btn-show-content').toggleClass('toggle-map-content');
    });
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
    
    if (isPlaying) {
        audioPlayer.pause();
        playPauseBtn.querySelector('i').classList.remove('fa-pause');
        playPauseBtn.querySelector('i').classList.add('fa-play');
    } else {
        audioPlayer.play();
        playPauseBtn.querySelector('i').classList.remove('fa-play');
        playPauseBtn.querySelector('i').classList.add('fa-pause');
    }
    isPlaying = !isPlaying;
}

// Función para canción anterior
function previousTrack() {
    if (playlist.length === 0) return;
    
    currentTrackIndex--;
    if (currentTrackIndex < 0) {
        currentTrackIndex = playlist.length - 1;
    }
    loadTrack(currentTrackIndex);
    if (isPlaying) {
        audioPlayer.play();
    }
}

// Función para siguiente canción
function nextTrack() {
    if (playlist.length === 0) return;
    
    currentTrackIndex++;
    if (currentTrackIndex >= playlist.length) {
        currentTrackIndex = 0;
    }
    loadTrack(currentTrackIndex);
    if (isPlaying) {
        audioPlayer.play();
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
        const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        progressFill.style.width = progress + '%';
        currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
    });

    // Cuando termina la canción
    audioPlayer.addEventListener('ended', function() {
        nextTrack();
    });

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
    prevBtn.addEventListener('click', previousTrack);
}

if (nextBtn) {
    nextBtn.addEventListener('click', nextTrack);
}

// Cargar primera canción al inicio
if (playlist.length > 0) {
    loadTrack(currentTrackIndex);
}
