// ===============================
//  BUSCAR BOLETO Y ASISTENCIA
// ===============================

const API_BASE = "https://eventoespecial.com.mx/MonseyMario";
const API_TOKEN = "m3Rcbgl3d3zCuvYifswcdZNYSM2tJiTXdP8WCUFI";
const WHATSAPP_NUMBER = "3321765410";

$(document).ready(function() {
    let guestData = []; // Cache de datos globales

    $('#guest_form').on('submit', function(e) {
        e.preventDefault();

        $.ajax({
            url: API_BASE + "/buscar_boleto",
            method: "POST",
            data: {
                _token: API_TOKEN,
                name: $('#name').val()
            },
            success: function(response) {
                let resultados = $('#resultados');
                resultados.empty();

                if (response.success && response.data.length > 0) {
                    guestData = response.data;
                    let grupoConfirmado = true;

                    guestData.forEach(function(invitado) {
                        let asistenciaConfirmada = invitado.asistencia === 'si';
                        let contenido = crearContenidoInvitado(invitado, asistenciaConfirmada);
                        
                        resultados.append(contenido);

                        if (asistenciaConfirmada) {
                            let form = document.getElementById(`form_${invitado.id}`);
                            form.action = form.action.replace(':id', encodeURIComponent(invitado.id));
                        } else {
                            grupoConfirmado = false;
                        }
                    });

                    if (grupoConfirmado) {
                        agregarBotonDescargaTodos(resultados, guestData[0].id_familia);
                    }

                    // Delegar evento de cambio en radio buttons
                    resultados.on('change', 'input[type=radio]', function() {
                        manejarCambioAsistencia(this, resultados);
                    });
                } else {
                    alert(response.message || 'No se encontraron invitados');
                }
            }
        });
    });

    function crearContenidoInvitado(invitado, asistenciaConfirmada) {
        let contenido = `
            <div class="guest-item" data-id="${invitado.id}" data-codigo_grup="${invitado.codigo_famili}">
                <span class="nombreInvitado">${invitado.Nombre}</span><br/>
                <input type="radio" name="asistencia_${invitado.id}" value="si" ${asistenciaConfirmada ? 'checked' : ''}> Sí
                <input type="radio" name="asistencia_${invitado.id}" value="no" ${invitado.invitacion === 'no' ? 'checked' : ''}> No
                <br/><span class="no_asiste"></span>
        `;

        if (asistenciaConfirmada) {
            contenido += `
                <div class="download">
                    <form action="${API_BASE}/ticket/:id" method="get" class="descarga-form" id="form_${invitado.id}">
                        <button type="submit" class="boton-dorado">Descargar boleto</button>
                    </form>
                </div>`;
        }

        contenido += `</div>`;
        return contenido;
    }

    function agregarBotonDescargaTodos(resultados, codigoGrupo) {
        resultados.append(`
            <div id="download_all_container">
                <form action="${API_BASE}/boletos_familia/${codigoGrupo}" method="get" class="descarga-form" id="form_descargar_todos">
                    <button type="submit" class="boton-dorado">Descargar todos los boletos</button>
                </form>
            </div>
        `);
    }

    function manejarCambioAsistencia(element, resultados) {
        let $element = $(element);
        let value = $element.val();
        let $guestDiv = $element.closest('.guest-item');
        let id = $guestDiv.data('id');
        let codigoGrupo = $guestDiv.data('codigo_grup');
        let nombreInvitado = $guestDiv.find('.nombreInvitado').text();
        let mensajeSpan = $guestDiv.find('span.no_asiste');

        // Actualizar asistencia en servidor
        $.ajax({
            url: API_BASE + "/actualizar_asistencia",
            method: "POST",
            data: {
                _token: API_TOKEN,
                id: id,
                asistencia: value
            }
        });

        if (value === 'no') {
            mensajeSpan.text(`Lamentamos que no puedas acompañarnos, ${nombreInvitado}.`);
            $guestDiv.find('.download').remove();

            setTimeout(function() {
                window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=Hola, ${nombreInvitado} no podrá asistir`, '_blank');
            }, 2000);
        } else {
            mensajeSpan.text('');

            if (!$guestDiv.find('.download').length) {
                $guestDiv.append(`
                    <div class="download">
                        <form action="${API_BASE}/ticket/:id" method="get" class="descarga-form" id="form_${id}">
                            <button type="submit" class="boton-dorado">Descargar boleto</button>
                        </form>
                    </div>
                `);

                let form = document.getElementById(`form_${id}`);
                form.action = form.action.replace(':id', encodeURIComponent(id));
            }
        }

        actualizarVisibilidadDescargaTodos(resultados, codigoGrupo);
    }

    function actualizarVisibilidadDescargaTodos(resultados, codigoGrupo) {
        let allConfirmed = true;
        resultados.find('input[value="si"]').each(function() {
            if (!$(this).is(':checked')) {
                allConfirmed = false;
            }
        });

        let $downloadContainer = $('#download_all_container');
        if (allConfirmed) {
            if (!$downloadContainer.length) {
                agregarBotonDescargaTodos(resultados, codigoGrupo);
            } else {
                $downloadContainer.show();
            }
        } else {
            if ($downloadContainer.length) {
                $downloadContainer.hide();
            }
        }
    }
});


// ===============================
//  AUDIO: REPRODUCCIÓN Y BOTÓN
// ===============================

const audio = document.getElementById('weddingSong');
const button = document.querySelector('.music-button');
audio.volume = 0.4;

function toggleMusic() {
    if (audio.paused) {
        audio.play().then(() => {
            button.textContent = '⏸ Pausar Canción';
        }).catch(() => {
            alert('Haz clic para permitir la reproducción de música');
        });
    } else {
        audio.pause();
        button.textContent = '▶ Reproducir Canción';
    }
}

window.addEventListener('DOMContentLoaded', () => {
    audio.play().then(() => {
        button.textContent = '⏸ Pausar Canción';
    }).catch(() => {
        button.textContent = '▶ Reproducir Canción';
    });
});


// ===============================
//  CONTADOR REGRESIVO
// ===============================

const weddingDate = new Date("2026-12-18T00:00:00");

function updateMinimalCountdown() {
    const now = new Date();
    const diff = weddingDate - now;

    if (diff <= 0) return;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    document.getElementById("d").textContent = String(days).padStart(2, '0');
    document.getElementById("h").textContent = String(hours).padStart(2, '0');
    document.getElementById("m").textContent = String(minutes).padStart(2, '0');
    document.getElementById("s").textContent = String(seconds).padStart(2, '0');
}

setInterval(updateMinimalCountdown, 1000);
updateMinimalCountdown();
