// --- CONEXIÓN A FIREBASE ---
const firebaseConfig = {
    // Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAQ2njMvEKaURHdQ1YNPmAPB9hXsz0u1AU",
  authDomain: "danielito-22118.firebaseapp.com",
  databaseURL: "https://danielito-22118.firebaseio.com",
  projectId: "danielito-22118",
  storageBucket: "danielito-22118.firebasestorage.app",
  messagingSenderId: "264146469968",
  appId: "1:264146469968:web:a71c1211aa01910493bd55"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
  // 🔥 Aquí pegas tu firebaseConfig 🔥
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// --- VARIABLES GLOBALES ---
const botonBatalla = document.getElementById('botonBatalla');
const inicio = document.getElementById('inicio');
const campoBatalla = document.getElementById('campoBatalla');
const notificacion = document.getElementById('notificacion');

let cartaArrastrando = null;
let idJugador = "jugador_" + Math.floor(Math.random() * 100000);
let salaID = null;
let esJugador1 = false;

// --- FUNCIONES DE FLUJO DE JUEGO ---

botonBatalla.addEventListener('click', () => {
    buscarOSalaNueva();
});

function buscarOSalaNueva() {
    database.ref('salas').once('value', snapshot => {
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
    escucharSoldados();
}

// --- FUNCIONES DE CARTAS Y SOLDADOS ---

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
    database.ref(`salas/${salaID}/soldados`).on('child_added', (snapshot) => {
        const soldado = snapshot.val();
        mostrarSoldado(soldado);
    });
}

function mostrarSoldado(soldado) {
    const nuevo = document.createElement('div');
    nuevo.classList.add('soldado');
    if (soldado.color !== idJugador) {
        nuevo.classList.add('rojo');
    }
    nuevo.style.left = soldado.x + 'px';
    nuevo.style.top = soldado.y + 'px';
    campoBatalla.appendChild(nuevo);
}

// --- FINAL DEL JUEGO (POR AHORA NO DETECTAMOS QUIÉN GANA, PERO PODEMOS AGREGARLO) ---

function finalizarJuego() {
    notificacion.classList.remove('oculto');
    setTimeout(() => {
        notificacion.classList.add('oculto');
        campoBatalla.classList.add('oculto');
        inicio.classList.remove('oculto');
    }, 3000);
}

// --- INICIALIZAR ---
window.addEventListener('load', () => {
    console.log("Juego cargado y esperando jugadores...");
});
