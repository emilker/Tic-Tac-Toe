const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public')); // Sirve archivos estáticos en /public

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/lobby.html');
});

// Variables para almacenar el estado del juego
let rooms = {};  // Objeto que mantiene las salas y su estado

io.on('connection', (socket) => {
   
    console.log(`Jugador conectado: ${socket.id}`);

        // Enviar la lista de salas disponibles al cliente que se conecta
        io.emit('rooms_list', Object.keys(rooms).map(name => ({
            name,
            status: rooms[name].players.length === 2 ? 'Llena' : 'Disponible',
        })));
        
    // Crear una sala
    socket.on('create_room', (roomName) => {
        if (!rooms[roomName]) {
            
            rooms[roomName] = {players: [],board: Array(9).fill(null),turn: 'X'};
            // Emitir la lista de salas actualizada
            io.emit('rooms_list', Object.keys(rooms).map(name => ({
                name,
                status: rooms[name].players.length === 2 ? 'Llena' : 'Disponible',
            })));

        } else {

            socket.emit('error_message', 'La sala ya existe.');
        }
    });

    // Unirse a una sala
    socket.on('join_room', (roomName, callback) => {
        if (rooms[roomName]) {
            const room = rooms[roomName];
            if (room.players.length < 2) {
                const playerSymbol = room.players.length === 0 ? 'X' : 'O'; // El primer jugador es X, el segundo es O
                room.players.push(socket.id);
                socket.join(roomName);
                callback({ success: true, playerSymbol }); // Devuelve el símbolo del jugador al cliente
                io.to(roomName).emit('room_update', rooms[roomName]);
    
                // Cuando la sala tenga 2 jugadores, comienza el juego
                if (room.players.length === 2) {
                    io.to(roomName).emit('start_game', { turn: room.turn });
                }
    
                io.emit('rooms_list', Object.keys(rooms).map(roomId => ({
                    name: roomId,
                    status: rooms[roomId].players.length === 2 ? 'Llena' : 'Disponible',
                })));
            } else {
                callback({ success: false, message: 'La sala está llena.' });
            }
        } else {
            callback({ success: false, message: 'La sala no existe.' });
        }
    });
    

    socket.on('make_move', (roomId, index) => {
        const room = rooms[roomId];
        // Verificar si el movimiento es válido
        if (room && room.board[index] === null && room.turn === (room.players[0] === socket.id ? 'X' : 'O')) {
           
            room.board[index] = room.turn;
            room.turn = room.turn === 'X' ? 'O' : 'X';
            io.to(roomId).emit('board_update', room.board);

            // Verificar si hay un ganador
            const winner = checkWinner(room.board);

            if (winner) {
                
                io.to(roomId).emit('game_over', { winner });
                delete rooms[roomId]; // Borrar la sala al finalizar la partida
            } 
            // Verificar si es empate
            else if (isBoardFull(room.board)) {
               
                io.to(roomId).emit('game_over', { winner: 'Empate' });
                delete rooms[roomId]; // Borrar la sala al finalizar la partida en caso de empate
            } 
            // Cambiar turno si no ha terminado
            else {

                io.to(roomId).emit('turn_change', room.turn);
            }
            
            io.emit('rooms_list', Object.keys(rooms).map(name => ({
                name,
                status: rooms[name].players.length === 2 ? 'Llena' : 'Disponible',
            })));

        }
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
