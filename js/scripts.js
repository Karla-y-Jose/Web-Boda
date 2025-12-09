/* ============================================
   WEDDING WEBSITE - MAIN SCRIPTS
   ============================================ */

$(document).ready(function() {
    // ========== Fixed Navigation ==========
    $(window).on('scroll', function() {
        if ($(this).scrollTop() > 50) {
            $('.navigation').addClass('fixed-nav');
        } else {
            $('.navigation').removeClass('fixed-nav');
        }
    });

    // ========== Mobile Navigation Toggle ==========
    $('.nav-toggle').click(function(e) {
        e.preventDefault();
        $(this).toggleClass('active');
        $('.header-nav').toggleClass('open');
    });

    $('.header-nav a').click(function() {
        $('.nav-toggle').removeClass('active');
        $('.header-nav').removeClass('open');
    });

    // ========== Countdown Timer ==========
    updateCountdown();
    setInterval(updateCountdown, 1000);

    // ========== RSVP Form Handling (Google Sheets via Apps Script) ==========
    // Configure `RSVP_ENDPOINT` with the deployed Apps Script web app URL.
    var RSVP_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxAMLQgfVWguPOFkZLtikRgZ4CxCrCQmlFsVHNVksJxQPLFjM6JDY9coJrtXDgDjytJ0w/exec';
    var RSVP_TOKEN = '230223'; // Must match SECRET_TOKEN in Apps Script

    $('#rsvp-form').on('submit', function(e) {
        e.preventDefault();

        var $form = $(this);
        var formData = {
            name: $('#rsvp-name').val().trim(),
            email: $('#rsvp-email').val().trim(),
            guests: $('#rsvp-guests').val() || '1',
            dietary: $('#rsvp-dietary').val() || '',
            attending: $('input[name="attending"]:checked').val() || 'Sí',
            message: $('#rsvp-message').val().trim(),
            secret: RSVP_TOKEN
        };

        if (!formData.name || !formData.email) {
            showAlert('warning', 'Por favor completa tu nombre y correo.');
            return;
        }

        if (!RSVP_ENDPOINT) {
            showAlert('danger', 'El endpoint de RSVP no está configurado.');
            return;
        }

        var $btn = $form.find('button[type="submit"]');
        $btn.prop('disabled', true).text('Enviando...');

        // Use form-encoded data (URLSearchParams) to avoid CORS preflight
        var formParams = new URLSearchParams();
        formParams.append('name', formData.name);
        formParams.append('email', formData.email);
        formParams.append('guests', formData.guests);
        formParams.append('dietary', formData.dietary);
        formParams.append('attending', formData.attending);
        formParams.append('message', formData.message);
        formParams.append('secret', formData.secret);

        fetch(RSVP_ENDPOINT, {
            method: 'POST',
            body: formParams
        })
        .then(function(res) {
            console.log('Response status:', res.status);
            if (!res.ok) {
                throw new Error('HTTP ' + res.status);
            }
            return res.json();
        })
        .then(function(json) {
            console.log('Response JSON:', json);
            if (json && json.result === 'success') {
                $form[0].reset();
                showAlert('success', '¡Gracias! Tu respuesta ha sido guardada.');
            } else {
                showAlert('danger', 'Respuesta del servidor: ' + (json.message || 'Error desconocido'));
            }
        })
        .catch(function(err) {
            console.error('RSVP error:', err);
            showAlert('danger', 'Error: ' + err.message);
        })
        .finally(function() {
            $btn.prop('disabled', false).text('Enviar RSVP');
        });
    });

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
    var startDate = formatearFechaCalendario(inicio);
    var endDate = formatearFechaCalendario(fin);
    var encodedTitulo = encodeURIComponent(titulo);
    var encodedUbicacion = encodeURIComponent(ubicacion);

    var opciones = `
        <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                    background: white; padding: 30px; border-radius: 10px; 
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 9999; text-align: center; 
                    min-width: 300px;">
            <h3 style="margin-top: 0; color: #333; margin-bottom: 20px;">Agregar al Calendario</h3>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <a href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodedTitulo}&dates=${inicio}/${fin}&location=${encodedUbicacion}"
                   target="_blank" 
                   style="padding: 12px 15px; background: #d4af37; color: #fff; text-decoration: none; 
                       border-radius: 5px; font-weight: bold; cursor: pointer; transition: all 0.3s ease;">
                   📅 Google Calendar
                </a>
                <a href="https://outlook.live.com/owa/?rru=addnewevent&subject=${encodedTitulo}&startdt=${startDate}&enddt=${endDate}&location=${encodedUbicacion}"
                   target="_blank"
                   style="padding: 12px 15px; background: #d4af37; color: #fff; text-decoration: none; 
                       border-radius: 5px; font-weight: bold; cursor: pointer; transition: all 0.3s ease;">
                   📧 Outlook / Office 365
                </a>
                <a href="https://calendar.yahoo.com/?v=60&view=d&type=20&title=${encodedTitulo}&st=${inicio}&et=${fin}&in_loc=${encodedUbicacion}"
                   target="_blank"
                   style="padding: 12px 15px; background: #d4af37; color: #fff; text-decoration: none; 
                       border-radius: 5px; font-weight: bold; cursor: pointer; transition: all 0.3s ease;">
                   🌐 Yahoo Calendar
                </a>
                <button onclick="this.parentElement.parentElement.remove()" style="padding: 12px 15px; background: #999; 
                        color: white; border: none; border-radius: 5px; font-weight: bold; cursor: pointer; transition: all 0.3s ease;">
                   Cerrar
                </button>
            </div>
        </div>
        <div onclick="this.remove()" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                                             background: rgba(0,0,0,0.5); z-index: 9998; cursor: pointer;"></div>
    `;

    var modal = document.createElement('div');
    modal.innerHTML = opciones;
    document.body.appendChild(modal);
}

function formatearFechaCalendario(fecha) {
    if (fecha.includes('T')) {
        var fechaParte = fecha.split('T')[0];
        var horaParte = fecha.split('T')[1];
        var año = fechaParte.substring(0, 4);
        var mes = fechaParte.substring(4, 6);
        var dia = fechaParte.substring(6, 8);
        var horas = horaParte.substring(0, 2);
        var minutos = horaParte.substring(2, 4);
        var segundos = horaParte.substring(4, 6);
        return año + '-' + mes + '-' + dia + 'T' + horas + ':' + minutos + ':' + segundos;
    }
    return fecha;
}

// Google Maps Integration
function initMap() {
    // Check if google.maps is available
    if (typeof google === 'undefined' || !google.maps) {
        console.warn('Google Maps API not loaded or billing not enabled');
        return;
    }

    var zapopan = { lat: 20.7282, lng: -103.3863 };
    
    // Check if map element exists
    if (!document.getElementById('map-canvas')) return;

    var map = new google.maps.Map(document.getElementById('map-canvas'), {
        zoom: 14,
        center: zapopan,
        styles: [
            {
                "featureType": "all",
                "elementType": "labels.text.fill",
                "stylers": [{ "color": "#ffffff" }]
            },
            {
                "featureType": "all",
                "elementType": "labels.text.stroke",
                "stylers": [{ "color": "#000000" }, { "lightness": 13 }]
            }
        ]
    });

    // Venue markers
    var venues = [
        {
            name: 'Parroquia Nuestra Señora de Altagracia',
            lat: 20.7282,
            lng: -103.3863,
            info: 'Ceremonia - 6:00 PM'
        },
        {
            name: 'Salon Andira',
            lat: 20.7282,
            lng: -103.3863,
            info: 'Recepción - 8:00 PM'
        }
    ];

    venues.forEach(function(venue) {
        var marker = new google.maps.Marker({
            position: { lat: venue.lat, lng: venue.lng },
            map: map,
            title: venue.name,
            icon: 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png'
        });

        var infowindow = new google.maps.InfoWindow({
            content: '<div style="color:#000; padding: 10px;"><strong>' + venue.name + '</strong><br>' + venue.info + '</div>'
        });

        marker.addListener('click', function() {
            infowindow.open(map, marker);
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
