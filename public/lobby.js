const socket = io();

const roomListContainer = document.getElementById('room-list-container');
const createRoomButton = document.getElementById('create-room');

// Escucha la lista de salas enviadas por el servidor y actualiza la interfaz
socket.on('rooms_list', (rooms) => {
    roomListContainer.innerHTML = '';  // Limpia la lista de salas
    rooms.forEach(room => {
        const roomElement = document.createElement('li');
        roomElement.textContent = `Sala: ${room.name} - ${room.status}`;
        roomElement.addEventListener('click', () => joinRoom(room.name));
        roomListContainer.appendChild(roomElement);
    });
});

// Función para unirse a una sala
function joinRoom(roomName) {
    window.location.href = `room.html?room=${roomName}`;  // Redirige al archivo de la sala
}

// Crear una nueva sala al hacer clic en el botón
createRoomButton.addEventListener('click', () => {
    const roomName = prompt('Ingresa el nombre de la nueva sala:');
    if (roomName) {
        socket.emit('create_room', roomName);
    }
});