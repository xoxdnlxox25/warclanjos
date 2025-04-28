const botonBatalla = document.getElementById('botonBatalla');
const inicio = document.getElementById('inicio');
const campoBatalla = document.getElementById('campoBatalla');
const notificacion = document.getElementById('notificacion');

botonBatalla.addEventListener('click', () => {
    inicio.classList.add('oculto');
    campoBatalla.classList.remove('oculto');
    reiniciarCampo();
});

let cartaArrastrando = null;

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
        crearSoldado(e.pageX, e.pageY, "verde");
        cartaArrastrando.remove();
        cartaArrastrando = null;
    }
});

function crearSoldado(x, y, color) {
    const soldado = document.createElement('div');
    soldado.classList.add('soldado');
    if (color === "rojo") soldado.classList.add('rojo');

    const barraVida = document.createElement('div');
    barraVida.classList.add('barra-vida');
    soldado.appendChild(barraVida);

    soldado.style.left = x + 'px';
    soldado.style.top = y + 'px';
    soldado.dataset.color = color;
    soldado.dataset.vida = "100";
    soldado.dataset.moviendo = "true";
    campoBatalla.appendChild(soldado);

    moverSoldado(soldado);
}

function moverSoldado(soldado) {
    let velocidad = soldado.dataset.color === "verde" ? -2 : 2;

    let intervalo = setInterval(() => {
        if (soldado.dataset.moviendo === "true") {
            let top = parseInt(soldado.style.top);
            top += velocidad;
            soldado.style.top = top + 'px';

            if (top < 0 || top > window.innerHeight) {
                soldado.remove();
                clearInterval(intervalo);
            }

            detectarObjetivoCercano(soldado);
        }
    }, 20);
}

function detectarObjetivoCercano(soldado) {
    if (soldado.dataset.moviendo !== "true") return;

    const enemigos = Array.from(document.querySelectorAll('.soldado')).filter(
        s => s.dataset.color !== soldado.dataset.color
    );

    let objetivo = enemigos.find(enemigo => {
        return Math.hypot(
            enemigo.offsetLeft - soldado.offsetLeft,
            enemigo.offsetTop - soldado.offsetTop
        ) < 80;
    });

    if (objetivo) {
        soldado.dataset.moviendo = "false";
        disparar(soldado, objetivo);
        return;
    }

    const torres = document.querySelectorAll(`.torre.${soldado.dataset.color === "verde" ? "roja" : "azul"}`);
    objetivo = Array.from(torres).find(torre => {
        return Math.hypot(
            torre.getBoundingClientRect().x + torre.offsetWidth / 2 - soldado.offsetLeft,
            torre.getBoundingClientRect().y + torre.offsetHeight / 2 - soldado.offsetTop
        ) < 100;
    });

    if (objetivo) {
        soldado.dataset.moviendo = "false";
        disparar(soldado, objetivo);
    }
}

function disparar(origen, objetivo) {
    const intervaloDisparo = setInterval(() => {
        if (!document.body.contains(origen)) {
            clearInterval(intervaloDisparo);
            return;
        }

        if (!document.body.contains(objetivo)) {
            clearInterval(intervaloDisparo);
            origen.dataset.moviendo = "true"; // Sigue avanzando
            return;
        }

        const bala = document.createElement('div');
        bala.classList.add('bala');
        bala.style.left = origen.offsetLeft + 'px';
        bala.style.top = origen.offsetTop + 'px';
        campoBatalla.appendChild(bala);

        const dx = (objetivo.offsetLeft + objetivo.offsetWidth / 2) - origen.offsetLeft;
        const dy = (objetivo.offsetTop + objetivo.offsetHeight / 2) - origen.offsetTop;
        const distancia = Math.hypot(dx, dy);
        const vx = dx / distancia;
        const vy = dy / distancia;

        const moverBala = setInterval(() => {
            bala.style.left = (bala.offsetLeft + vx * 5) + 'px';
            bala.style.top = (bala.offsetTop + vy * 5) + 'px';

            const distanciaActual = Math.hypot(
                (objetivo.offsetLeft + objetivo.offsetWidth / 2) - bala.offsetLeft,
                (objetivo.offsetTop + objetivo.offsetHeight / 2) - bala.offsetTop
            );

            if (distanciaActual < 10) {
                bala.remove();
                hacerDaño(objetivo, 20, origen);
                clearInterval(moverBala);
            }
        }, 20);
    }, 1000);
}

function hacerDaño(objetivo, cantidad, atacante) {
    if (objetivo.dataset.vida) {
        let vidaActual = parseInt(objetivo.dataset.vida);
        vidaActual -= cantidad;
        objetivo.dataset.vida = vidaActual;
        const barra = objetivo.querySelector('.barra-vida');
        if (barra) barra.style.width = (vidaActual / 100 * 40) + "px";

        if (vidaActual <= 0) {
            objetivo.remove();
            if (atacante) atacante.dataset.moviendo = "true";
            verificarFinDelJuego();
        }
    }
}

function verificarFinDelJuego() {
    const torresRojas = document.querySelectorAll('.torre.roja');
    const torresAzules = document.querySelectorAll('.torre.azul');

    if (torresRojas.length === 0 || torresAzules.length === 0) {
        setTimeout(() => {
            // Mostrar notificación
            notificacion.classList.remove('oculto');

            // Eliminar soldados, torres y balas
            document.querySelectorAll('.soldado, .torre, .bala').forEach(elemento => {
                elemento.remove();
            });

            // Ocultar notificación y volver al inicio después de 3 segundos
            setTimeout(() => {
                notificacion.classList.add('oculto');
                campoBatalla.classList.add('oculto');
                inicio.classList.remove('oculto');
            }, 3000);

        }, 500);
    }
}

function generarSoldadosEnemigos() {
    setInterval(() => {
        const torresAzules = document.querySelectorAll('.torre.azul');
        if (torresAzules.length > 0) {
            const randomTorre = torresAzules[Math.floor(Math.random() * torresAzules.length)];
            const x = randomTorre.offsetLeft + randomTorre.offsetWidth / 2;
            const y = 0;
            crearSoldado(x, y, "rojo");
        }
    }, 5000);
}

function crearBarrasDeVidaTorres() {
    const torres = document.querySelectorAll('.torre');
    torres.forEach(torre => {
        const barraVida = document.createElement('div');
        barraVida.classList.add('barra-vida');
        torre.appendChild(barraVida);
        torre.dataset.vida = "200";
    });
}

function reiniciarCampo() {
    campoBatalla.innerHTML = `
    <div class="campo-juego">
        <div class="fila torres-rojas">
            <div class="torre roja"></div>
            <div class="torre roja grande"></div>
            <div class="torre roja"></div>
        </div>
        <div class="espacio"></div>
        <div class="fila torres-azules">
            <div class="torre azul"></div>
            <div class="torre azul grande"></div>
            <div class="torre azul"></div>
        </div>
    </div>
    <div class="cartas">
        <div class="carta" draggable="true">Carta 1</div>
        <div class="carta" draggable="true">Carta 2</div>
        <div class="carta" draggable="true">Carta 3</div>
        <div class="carta" draggable="true">Carta 4</div>
    </div>
    `;
    crearBarrasDeVidaTorres();
    inicializarCartas();
}

window.addEventListener('load', () => {
    crearBarrasDeVidaTorres();
    inicializarCartas();
    generarSoldadosEnemigos();
});
