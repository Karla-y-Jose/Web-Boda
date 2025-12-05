// ===============================
//  BUSCAR BOLETO Y ASISTENCIA
// ===============================

$(document).ready(function() {
    $('#guest_form').on('submit', function(e) {
        e.preventDefault();

        $.ajax({
            url: "https://eventoespecial.com.mx/MonseyMario/buscar_boleto",
            method: "POST",
            data: {
                _token: "m3Rcbgl3d3zCuvYifswcdZNYSM2tJiTXdP8WCUFI",
                name: $('#name').val()
            },
            success: function(response) {
                let resultados = $('#resultados');
                resultados.empty();

                if (response.success) {
                    let data = response.data;

                    if (data.length > 0) {
                        let grupoConfirmado = true;

                        data.forEach(function(invitado) {
                            let asistenciaConfirmada = invitado.asistencia === 'si';

                            let contenido = `
                                <div class="mb-4" data-id="${invitado.id}" data-codigo_grup="${invitado.codigo_famili}">
                                    <span class="nombreInvitado">${invitado.Nombre}</span><br/>
                                    <input type="radio" name="asistencia_${invitado.id}" value="si" ${asistenciaConfirmada ? 'checked' : ''}> Sí
                                    <input type="radio" name="asistencia_${invitado.id}" value="no" ${invitado.invitacion === 'no' ? 'checked' : ''}> No
                                    <br/><span class="no_asiste"></span>
                            `;

                            if (asistenciaConfirmada) {
                                contenido += `
                                    <div class="download">
                                        <form action="https://eventoespecial.com.mx/MonseyMario/ticket/:id" method="get" class="contact-form" id="form_${invitado.id}">
                                            <button type="submit" class="btn btn-sm boton mt-4 mb-4 boton-dorado" style="width: 60%; background-color: #d4af37; color: #FFF;">Descargar boleto</button>
                                        </form>
                                    </div>`;
                            } else {
                                grupoConfirmado = false;
                            }

                            contenido += `</div>`;
                            resultados.append(contenido);

                            if (asistenciaConfirmada) {
                                let form = document.getElementById(`form_${invitado.id}`);
                                form.action = form.action.replace(':id', encodeURIComponent(invitado.id));
                            }
                        });

                        if (grupoConfirmado) {
                            resultados.append(`
                                <div id="download_all_container">
                                    <form action="https://eventoespecial.com.mx/MonseyMario/boletos_familia/:codigo_grup" method="get" class="contact-form" id="form_descargar_todos">
                                        <button type="submit" class="btn btn-sm boton mt-4 mb-4 boton-dorado" style="width: 60%; background-color: #d4af37; color: #FFF;">Descargar todos los boletos</button>
                                    </form>
                                </div>
                            `);

                            let form = document.getElementById('form_descargar_todos');
                            form.action = form.action.replace(':codigo_grup', data[0].id_familia);
                        }

                        // CAMBIO DE RADIO BUTTON
                        $('input[type=radio]').on('change', function() {
                            let value = $(this).val();
                            let id = $(this).closest('div').data('id');
                            let codigoGrupo = $(this).closest('div').data('codigo_grup');
                            let nombreInvitado = $(this).siblings('.nombreInvitado').text();
                            let mensajeSpan = $(this).siblings('span.no_asiste');

                            // Actualizar asistencia
                            $.ajax({
                                url: "https://eventoespecial.com.mx/MonseyMario/actualizar_asistencia",
                                method: "POST",
                                data: {
                                    _token: "m3Rcbgl3d3zCuvYifswcdZNYSM2tJiTXdP8WCUFI",
                                    id: id,
                                    asistencia: value
                                }
                            });

                            if (value === 'no') {
                                mensajeSpan.text(`Lamentamos que no puedas acompañarnos, ${nombreInvitado}.`);

                                setTimeout(function() {
                                    window.open(`https://wa.me/3321765410?text=Hola, ${nombreInvitado} no podrá asistir`, '_blank');
                                }, 2000);

                                $(this).closest('div').find('.download').remove();

                            } else {
                                mensajeSpan.text('');

                                if (!$(this).closest('div').find('.download').length) {
                                    $(this).closest('div').append(`
                                        <div class="download">
                                            <form action="https://eventoespecial.com.mx/MonseyMario/ticket/:id" method="get" class="contact-form" id="form_${id}">
                                                <button type="submit" class="btn btn-sm boton mt-4 mb-4 boton-dorado" style="width: 60%; background-color: #d4af37; color: #FFF;">Descargar boleto</button>
                                            </form>
                                        </div>
                                    `);

                                    let form = document.getElementById(`form_${id}`);
                                    form.action = form.action.replace(':id', encodeURIComponent(id));
                                }
                            }

                            // Revisar confirmación completa del grupo
                            let allConfirmed = true;
                            $('input[value="si"]').each(function() {
                                if (!$(this).is(':checked')) {
                                    allConfirmed = false;
                                }
                            });

                            if (allConfirmed) {
                                if (!$('#download_all_container').length) {
                                    resultados.append(`
                                        <div id="download_all_container">
                                            <form action="https://eventoespecial.com.mx/MonseyMario/boletos_familia/:codigo_grup" method="get" class="contact-form" id="form_descargar_todos">
                                                <button type="submit" class="btn btn-sm boton mt-4 mb-4 boton-dorado" style="width: 60%; background-color: #d4af37; color: #FFF;">Descargar todos los boletos</button>
                                            </form>
                                        </div>
                                    `);
                                }
                                let form = document.getElementById('form_descargar_todos');
                                form.action = form.action.replace(':codigo_grup', codigoGrupo);
                                $('#download_all_container').show();
                            } else {
                                $('#download_all_container').hide();
                            }
                        });
                    }
                } else {
                    alert(response.message);
                }
            }
        });
    });
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
