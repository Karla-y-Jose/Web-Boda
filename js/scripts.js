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
    var RSVP_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxAMLQgfVWguPOFkZLtikRgZ4CxCrCQmlFsVHNVksJxQPLFjM6JDY9coJrtXDgDjytJ0w/exec';

    $('#rsvp-form').on('submit', function(e) {
        e.preventDefault();
        var data = $(this).serialize();
        var $btn = $(this).find('button[type="submit"]');
        
        $('#alert-wrapper').html(alert_markup('info', '<strong>Un momento...</strong> Estamos guardando tus datos.'));
        $btn.prop('disabled', true);
        
        $.post(RSVP_ENDPOINT, data)
            .done(function(response) {
                console.log('RSVP Response:', response);
                if (response.result === 'error') {
                    $('#alert-wrapper').html(alert_markup('danger', '<strong>¡Lo sentimos!</strong> ' + response.message));
                } else {
                    $('#alert-wrapper').html('');
                    $('#rsvp-form')[0].reset();
                    
                    // Show confirmation modal with add-to-calendar option
                    $('#rsvp-modal').modal('show');
                    
                    // Add calendar button
                    var calendarBtn = '<a href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=Boda%20de%20Karla%20%26%20Jose&dates=20261218T180000/20261218T230000&location=Zapopan,%20Jalisco" target="_blank" class="btn btn-fill" style="background:#d4af37; color:#fff; padding:10px 20px; margin-top:10px; display:inline-block; text-decoration:none; border-radius:4px;">📅 Agregar al Calendario</a>';
                    $('#add-to-cal').html(calendarBtn);
                }
            })
            .fail(function(err) {
                console.error('RSVP error:', err);
                $('#alert-wrapper').html(alert_markup('danger', '<strong>¡Lo sentimos!</strong> Hay un problema con el servidor. Por favor intenta más tarde.'));
            })
            .always(function() {
                $btn.prop('disabled', false);
            });
    });
     
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

// Leaflet Map Integration
function initMap() {
    // Check if map element exists
    if (!document.getElementById('map-canvas')) {
        console.warn('Map container element not found');
        return;
    }

    // Check if Leaflet is available
    if (typeof L === 'undefined') {
        console.warn('Leaflet library not loaded');
        return;
    }

    var zapopan = { lat: 20.7784148, lng: -103.4550886 };
    
    // Create Leaflet map
    var map = L.map('map-canvas').setView([zapopan.lat, zapopan.lng], 13);

    // Add OpenStreetMap tiles (free, no billing required)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);

    // Venue markers
    var venues = [
        {
            name: 'Parroquia Nuestra Señora de Altagracia',
            lat: 20.744395,
            lng: -103.3928862,
            info: 'Ceremonia - 6:00 PM',
            color: '#d4af37' // Gold for ceremony
        },
        {
            name: 'Salon Andira',
            lat: 20.7784148,
            lng: -103.4550886,
            info: 'Recepción - 8:00 PM',
            color: '#2E8B57' // Green for reception
        }
    ];

    // Custom marker icons
    function createCustomIcon(color) {
        var html = '<div style="width: 24px; height: 24px; border-radius: 50%; background-color: ' + color + '; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>';
        return L.divIcon({
            html: html,
            className: 'custom-marker',
            iconSize: [30, 30],
            iconAnchor: [15, 15],
            popupAnchor: [0, -15]
        });
    }

    venues.forEach(function(venue) {
        var marker = L.marker(
            [venue.lat, venue.lng],
            { icon: createCustomIcon(venue.color) }
        ).addTo(map);

        var popupContent = '<div style="font-family: Montserrat, sans-serif; text-align: center;">' +
                          '<strong style="color: #2E8B57; font-size: 14px;">' + venue.name + '</strong><br>' +
                          '<span style="color: #666; font-size: 12px;">' + venue.info + '</span></div>';

        marker.bindPopup(popupContent);
        marker.on('click', function() {
            marker.openPopup();
        });
    });
}

// Initialize map on load
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
