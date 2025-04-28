// --- VARIABLES GLOBALES ---
const botonBatalla = document.getElementById('botonBatalla');
const inicio = document.getElementById('inicio');
const campoBatalla = document.getElementById('campoBatalla');
const notificacion = document.getElementById('notificacion');

let cartaArrastrando = null;
let idJugador = "jugador_" + Math.floor(Math.random() * 100000);
let salaID = null;
let esJugador1 = false;
let soldadosEnPantalla = {};
let torres = [];
let balas = [];

// --- FLUJO DE JUEGO ---
botonBatalla.addEventListener('click', () => {
    buscarOSalaNueva();
});

function buscarOSalaNueva() {
    database.ref('salas').once('value').then(snapshot => {
        let salas = snapshot.val();
        if (salas) {
            for (let key in salas) {
                if (salas[key].estado === "esperando") {
                    salaID = key;
                    database.ref('salas/' + salaID).update({
                        estado: "jugando",
                        jugador2: idJugador
                    });
                    esJugador1 = false;
                    comenzarBatalla();
                    return;
                }
            }
        }
        crearSalaNueva();
    }).catch(error => {
        console.error("Error buscando salas:", error);
        alert("Error conectando al juego. Verifica tu internet y vuelve a intentar.");
    });
}

function crearSalaNueva() {
    salaID = database.ref('salas').push().key;
    database.ref('salas/' + salaID).set({
        estado: "esperando",
        jugador1: idJugador
    });
    esJugador1 = true;
    esperarJugador();
}

function esperarJugador() {
    database.ref('salas/' + salaID).on('value', snapshot => {
        const sala = snapshot.val();
        if (sala.estado === "jugando") {
            comenzarBatalla();
        }
    });
}

function comenzarBatalla() {
    inicio.classList.add('oculto');
    campoBatalla.classList.remove('oculto');
    inicializarCartas();
    inicializarTorres();
    escucharSoldados();
    animarSoldados();
    animarBalas();
}

// --- FUNCIONES DE JUEGO ---
function inicializarCartas() {
    document.querySelectorAll('.carta').forEach(carta => {
        carta.addEventListener('dragstart', () => {
            cartaArrastrando = carta.cloneNode(true);
            cartaArrastrando.classList.add('dragging');
            document.body.appendChild(cartaArrastrando);
        });

        carta.addEventListener('dragend', () => {
            if (cartaArrastrando) {
                cartaArrastrando.remove();
                cartaArrastrando = null;
            }
        });
    });
}

document.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (cartaArrastrando) {
        cartaArrastrando.style.left = e.pageX + 'px';
        cartaArrastrando.style.top = e.pageY + 'px';
    }
});

document.addEventListener('drop', (e) => {
    e.preventDefault();
    if (cartaArrastrando) {
        lanzarSoldado(e.pageX, e.pageY);
        cartaArrastrando.remove();
        cartaArrastrando = null;
    }
});

function lanzarSoldado(x, y) {
    const nuevoSoldado = {
        id: Math.random().toString(36).substr(2, 9),
        x: x,
        y: y,
        color: idJugador
    };
    database.ref(`salas/${salaID}/soldados/${nuevoSoldado.id}`).set(nuevoSoldado);
}

function escucharSoldados() {
    database.ref(`salas/${salaID}/soldados`).on('child_added', snapshot => {
        const soldado = snapshot.val();
        mostrarSoldado(soldado);
    });
}

function mostrarSoldado(soldado) {
    const nuevo = document.createElement('div');
    nuevo.classList.add('soldado');
    nuevo.dataset.id = soldado.id;
    if (soldado.color !== idJugador) {
        nuevo.classList.add('rojo');
    }
    nuevo.style.left = soldado.x + 'px';
    nuevo.style.top = soldado.y + 'px';
    campoBatalla.appendChild(nuevo);
    soldadosEnPantalla[soldado.id] = {
        elemento: nuevo,
        color: soldado.color,
        objetivo: null,
        tiempoDisparo: 0
    };
}

function inicializarTorres() {
    torres = Array.from(document.querySelectorAll('.torre')).map(torre => {
        const barraVida = document.createElement('div');
        barraVida.classList.add('barra-vida');
        torre.appendChild(barraVida);
        return {
            elemento: torre,
            barra: barraVida,
            vida: 100
        };
    });
}

function animarSoldados() {
    setInterval(() => {
        for (let id in soldadosEnPantalla) {
            const soldado = soldadosEnPantalla[id];
            if (!soldado.objetivo) {
                const torreCercana = buscarTorreCercana(soldado.elemento);
                if (torreCercana) {
                    soldado.objetivo = torreCercana;
                }
            }
            if (soldado.objetivo) {
                atacarTorre(soldado);
            }
        }
    }, 50);
}

function buscarTorreCercana(soldado) {
    let soldadoRect = soldado.getBoundingClientRect();
    for (let torre of torres) {
        let torreRect = torre.elemento.getBoundingClientRect();
        let distancia = Math.hypot(
            (soldadoRect.left - torreRect.left),
            (soldadoRect.top - torreRect.top)
        );
        if (distancia < 150) {
            return torre;
        }
    }
    return null;
}

function atacarTorre(soldado) {
    if (soldado.tiempoDisparo <= 0) {
        dispararBala(soldado.elemento, soldado.objetivo);
        soldado.tiempoDisparo = 30;
    } else {
        soldado.tiempoDisparo--;
    }
}

function dispararBala(origen, objetivo) {
    const bala = document.createElement('div');
    bala.classList.add('bala');
    bala.style.left = origen.style.left;
    bala.style.top = origen.style.top;
    campoBatalla.appendChild(bala);

    balas.push({
        elemento: bala,
        objetivo: objetivo
    });
}

function animarBalas() {
    setInterval(() => {
        balas.forEach((bala, index) => {
            if (!bala.objetivo) return;

            let balaRect = bala.elemento.getBoundingClientRect();
            let objetivoRect = bala.objetivo.elemento.getBoundingClientRect();

            let dx = objetivoRect.left - balaRect.left;
            let dy = objetivoRect.top - balaRect.top;
            let distancia = Math.hypot(dx, dy);

            if (distancia > 5) {
                bala.elemento.style.left = parseInt(bala.elemento.style.left) + dx / distancia * 5 + 'px';
                bala.elemento.style.top = parseInt(bala.elemento.style.top) + dy / distancia * 5 + 'px';
            } else {
                bala.elemento.remove();
                balas.splice(index, 1);
                dañoATorre(bala.objetivo);
            }
        });
    }, 30);
}

function dañoATorre(torre) {
    torre.vida -= 10;
    actualizarBarraVida(torre);
    if (torre.vida <= 0) {
        torre.elemento.remove();
        torres = torres.filter(t => t !== torre);
        verificarFinDePartida();
    }
}

function actualizarBarraVida(torre) {
    if (torre.barra) {
        torre.barra.style.width = torre.vida + '%';
    }
}

function verificarFinDePartida() {
    if (torres.length === 0) {
        mostrarVictoria();
    }
}

function mostrarVictoria() {
    notificacion.textContent = "¡Victoria!";
    notificacion.classList.remove('oculto');
    setTimeout(() => {
        notificacion.classList.add('oculto');
        campoBatalla.classList.add('oculto');
        inicio.classList.remove('oculto');
    }, 4000);
}

window.addEventListener('load', () => {
    console.log("Juego cargado y esperando jugadores...");
});
