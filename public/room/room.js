const socket = io();

const urlParams = new URLSearchParams(window.location.search);
const roomName = urlParams.get('room'); 

const backButton = document.getElementById('back-to-lobby');
const cells = document.querySelectorAll('.cell');
const status = document.getElementById('status');
const winnerMessage = document.getElementById('winner-message');

let playerSymbol = null;
let gameStarted = false;  

// -------------------------
//  UNIRSE A LA SALA
// -------------------------
function joinRoom() {
    socket.emit('join_room', roomName, (response) => {
        if (response.success) {

            playerSymbol = response.playerSymbol;

            // Mensaje real cuando entras
            status.textContent = `Eres ${playerSymbol}. Esperando al segundo jugador...`;

        } else {
            alert(response.message);
            window.location.href = '/lobby/lobby.html';
        }
    });
}

joinRoom();

// -----------------------------
//  CLICK EN CELDA (MOVIMIENTO)
// -----------------------------
cells.forEach(cell => {
    cell.addEventListener('click', () => {

        // BLOQUEADO si el juego no ha iniciado
        if (!gameStarted) return;

        const index = cell.getAttribute('data-index');
        socket.emit('make_move', roomName, index);
    });
});

// -----------------------------
//  INICIO DEL JUEGO
// -----------------------------
socket.on('start_game', () => {
    gameStarted = true;
    status.textContent = `Juego iniciado, eres ${playerSymbol}`;
});

// -----------------------------
//  TABLERO ACTUALIZADO
// -----------------------------
socket.on('board_update', (board) => {
    board.forEach((symbol, index) => {
        cells[index].textContent = symbol;
    });
});

// -----------------------------
//  CAMBIO DE TURNO
// -----------------------------
socket.on('turn_change', (turn) => {
    status.textContent = `Turno de ${turn}`;
});

// -----------------------------
//  PARTIDA TERMINADA
// -----------------------------
socket.on('game_over', ({ winner }) => {
    
    winnerMessage.innerHTML = `
        <div>Ganador: ${winner}</div>
    `;
    winnerMessage.style.display = "block";

    backButton.style.display = "block";

    cells.forEach(cell => {
        cell.style.pointerEvents = 'none';
    });
});

// -----------------------------
//  EL OTRO JUGADOR SE FUE
// -----------------------------
socket.on('opponent_left', ({ message }) => {

    winnerMessage.innerHTML = `
        <div>Juego terminado.</div>
        <div>${message}</div>
    `;
    winnerMessage.style.display = "block";

    backButton.style.display = "block";

    cells.forEach(cell => {
        cell.style.pointerEvents = 'none';
    });
});

// -----------------------------
//  VOLVER AL LOBBY
// -----------------------------
backButton.addEventListener('click', () => {
    window.location.href = '/lobby/lobby.html';
});