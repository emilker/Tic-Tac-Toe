# 🎮 Tic Tac Toe Multiplayer (Node.js + Socket.IO)

Un juego clásico de **Tres en Raya (Tic Tac Toe)** multijugador en tiempo real, desarrollado con **Node.js**, **Express** y **Socket.IO**.  
Permite crear salas, unirse a partidas activas y jugar contra otro jugador en línea.

---

## 🚀 Características principales

- 🧩 **Modo multijugador en tiempo real** con sincronización de jugadas.
- 🏠 **Lobby dinámico**: los jugadores pueden crear o unirse a salas disponibles.
- 🔄 **Actualización automática** del tablero entre ambos jugadores.
- 🏁 **Detección automática de ganador, empate o abandono.**
- 💡 **Interfaz simple y ligera**, construida con HTML, CSS y JavaScript puro.
- 🌐 Servidor Express que sirve los archivos estáticos y gestiona la comunicación WebSocket.

---

## 🧠 Tecnologías utilizadas

| Tecnología | Descripción |
|-------------|--------------|
| **Node.js** | Entorno de ejecución del servidor. |
| **Express** | Framework para crear el servidor HTTP y servir los archivos estáticos. |
| **Socket.IO** | Biblioteca para comunicación en tiempo real entre cliente y servidor. |
| **HTML5 / CSS3 / JavaScript** | Interfaz de usuario y lógica del cliente. |

---

## 📂 Estructura del proyecto
```plaintext
📦 tic-tac-toe
├── public/
│ ├── lobby/
│ │ ├── lobby.html
│ │ ├── lobby.js
│ │ └── lobby.css
│ ├── room/
│ │ ├── room.html
│ │ ├── room.js
│ │ └── room.css
│ ├── rules/
│ │ ├── rules.html
│ │ └── rules.css
│ └── assets/ (imágenes, íconos, etc.)
│
├── server.js
├── package.json
└── README.md
```
## ⚙️ Instalación y ejecución local

1. **Clona el repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/tic-tac-toe-multiplayer.git
   ```

2. **Entra en la carpeta del proyecto:**

   ```bash
   cd Tic-Tac-Toe
   ```

3. **Instala las dependencias:**

   ```bash
   npm install

4. **Ejecuta el servidor:**

    ```bash
    node server.js
    ```

5. **Abre el navegador y entra en:**
    ```bash
    http://localhost:3000
    ```