const socket = io();

const urlParams = new URLSearchParams(window.location.search);
const roomName = urlParams.get('room'); // Obtiene el nombre de la sala desde la URL

let playerSymbol;  // 'X' o 'O'

// Elementos del DOM
const cells = document.querySelectorAll('.cell');
const status = document.getElementById('status');
const winnerMessage = document.getElementById('winner-message');

// Función para unir al jugador a la sala
function joinRoom() {
    socket.emit('join_room', roomName, (response) => {
        if (response.success) {
            playerSymbol = response.playerSymbol; // Asigna el símbolo recibido del servidor
            console.log('Unido a la sala correctamente');
            status.textContent = `Esperando al segundo jugador...`;
        } else {
            alert(response.message);
            window.location.href = '/lobby/lobby.html'; // Regresa al lobby si la sala no existe o está llena
        }
    });
}

// Llamar a `joinRoom` solo cuando el jugador esté listo para unirse
joinRoom(); // Llamada cuando la página se ha cargado y se ha comprobado la sala

// Realiza un movimiento en el tablero cuando un jugador hace clic en una celda
cells.forEach(cell => {
    cell.addEventListener('click', () => {
        const index = cell.getAttribute('data-index');
        socket.emit('make_move', roomName, index);
    });
});

// Inicia el juego al recibir el evento 'start_game' del servidor
socket.on('start_game', () => {
    status.textContent = `Juego iniciado, eres ${playerSymbol}`;
});

// Actualiza el tablero cuando recibe una actualización del servidor
socket.on('board_update', (board) => {
    board.forEach((symbol, index) => {
        cells[index].textContent = symbol;
    });
});

// Cambio de turno
socket.on('turn_change', (turn) => {
    status.textContent = `Turno de ${turn}`;
});

// Fin del juego
socket.on('game_over', ({ winner }) => {
    winnerMessage.textContent = `Juego terminado. Ganador: ${winner}`;
});
