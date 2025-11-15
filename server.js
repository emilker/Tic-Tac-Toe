const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public')); // Sirve archivos estáticos en /public

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/lobby/lobby.html');
});

/*
  Estructura de `rooms`:
  rooms = {
    roomName: {
      players: [ { id: socketId, symbol: 'X'|'O' } ],
      board: [null,...,null],
      turn: 'X'|'O'
    },
    ...
  }
*/
let rooms = {};

// emitir lista de salas actualizada a todos
function broadcastRoomsList() {
    const list = Object.keys(rooms).map(name => ({
        name,
        status: rooms[name].players.length === 2 ? 'Llena' : 'Disponible'
    }));
    io.emit('rooms_list', list);
}

io.on('connection', (socket) => {
    console.log(`Jugador conectado: ${socket.id}`);

    // Al conectar, envía lista de salas actual
    broadcastRoomsList();

    // Crear sala
    socket.on('create_room', (roomName, callback) => {
        if (!roomName) {
            if (callback) callback({ success: false, message: 'Nombre de sala inválido' });
            return;
        }
        if (rooms[roomName]) {
            if (callback) callback({ success: false, message: 'La sala ya existe.' });
            return;
        }

        rooms[roomName] = {
            players: [],
            board: Array(9).fill(null),
            turn: 'X'
        };

        console.log(`Sala creada: ${roomName}`);
        broadcastRoomsList();
        if (callback) callback({ success: true });
    });

    // Unirse a sala
    socket.on('join_room', (roomName, callback) => {
        const room = rooms[roomName];
        if (!room) {
            if (callback) callback({ success: false, message: 'La sala no existe.' });
            return;
        }

        if (room.players.length >= 2) {
            if (callback) callback({ success: false, message: 'La sala está llena.' });
            return;
        }

        // Asignar símbolo
        const playerSymbol = room.players.length === 0 ? 'X' : 'O';
        room.players.push({ id: socket.id, symbol: playerSymbol });

        // Join socket.io room y marcar en socket para desconexión
        socket.join(roomName);
        socket.roomName = roomName;
        socket.playerSymbol = playerSymbol;

        console.log(`Jugador ${socket.id} se unió a ${roomName} como ${playerSymbol}`);

        // Enviar estado inicial al nuevo jugador
        socket.emit('board_update', room.board);
        socket.emit('turn_change', room.turn);

        // Informar a todos en la sala del estado actualizado
        io.to(roomName).emit('room_update', {
            players: room.players.map(p => p.id),
            turn: room.turn
        });

        // Si ya hay 2 jugadores, iniciar juego
        if (room.players.length === 2) {
            // Notificar a todos que empieza el juego
            io.to(roomName).emit('start_game', { turn: room.turn });
        }

        broadcastRoomsList();

        if (callback) callback({ success: true, playerSymbol });
    });

    // Movimiento realizado por un jugador
    socket.on('make_move', (roomName, index) => {
        const room = rooms[roomName];
        if (!room) return;

        // Validaciones básicas
        const idx = Number(index);
        if (isNaN(idx) || idx < 0 || idx > 8) return;

        // Encontrar jugador y su símbolo
        const player = room.players.find(p => p.id === socket.id);
        if (!player) return; // jugador no en la sala

        // Verificar turno
        if (player.symbol !== room.turn) {
            // Ignorar movimiento fuera de turno
            return;
        }

        // Verificar casilla vacía
        if (room.board[idx] !== null) return;

        // Aplicar movimiento
        room.board[idx] = player.symbol;
        // Notificar tablero a todos en la sala
        io.to(roomName).emit('board_update', room.board);

        // Comprobar ganador
        const winner = checkWinner(room.board);
        if (winner) {
            io.to(roomName).emit('game_over', { winner });
            // borrar sala
            delete rooms[roomName];
            broadcastRoomsList();
            return;
        }

        // Comprobar empate
        if (isBoardFull(room.board)) {
            io.to(roomName).emit('game_over', { winner: 'Empate' });
            delete rooms[roomName];
            broadcastRoomsList();
            return;
        }

        // Cambiar turno
        room.turn = room.turn === 'X' ? 'O' : 'X';
        io.to(roomName).emit('turn_change', room.turn);

        // Actualizar lista por si hay cambios
        broadcastRoomsList();
    });

    // Manejo de desconexión
    socket.on('disconnect', () => {
        console.log(`Jugador desconectado: ${socket.id}`);

        const roomName = socket.roomName;
        if (!roomName) return; // el socket no estaba en ninguna sala

        const room = rooms[roomName];
        if (!room) {
            // Si la sala ya fue eliminada, limpiar y salir
            socket.roomName = undefined;
            return;
        }

        // Eliminar al jugador de la sala
        room.players = room.players.filter(p => p.id !== socket.id);

        // Si queda 1 jugador -> avisar al jugador restante y eliminar sala
        if (room.players.length === 1) {
            const remaining = room.players[0];
            // Avisamos directamente al socket del jugador restante
            io.to(remaining.id).emit('opponent_left', {
                message: "El otro jugador abandonó la sala."
            });

            // Borrar sala
            delete rooms[roomName];
            console.log(`Sala ${roomName} eliminada porque un jugador se desconectó.`);
        }
        // Si no queda nadie -> borrar sala
        else if (room.players.length === 0) {
            delete rooms[roomName];
            console.log(`Sala ${roomName} eliminada (sin jugadores).`);
        } else {
            // Si por alguna razón quedan >1 jugadores (no debería) actualizamos room
            io.to(roomName).emit('room_update', {
                players: room.players.map(p => p.id),
                turn: room.turn
            });
        }

        // Limpiar datos del socket
        socket.roomName = undefined;
        socket.playerSymbol = undefined;

        broadcastRoomsList();
    });

    // (Opcional) permitir que un cliente pregunte por la lista actual instantáneamente
    socket.on('request_rooms', () => {
        broadcastRoomsList();
    });
});

// Función para verificar si el tablero está lleno (empate)
function isBoardFull(board) {
    return board.every(cell => cell !== null);
}

// Función para verificar el ganador
function checkWinner(board) {
    const winningCombinations = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];
    for (const combo of winningCombinations) {
        const [a, b, c] = combo;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    return null;
}

// Inicia el servidor
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Servidor en ejecución en http://localhost:${PORT}`);
});
