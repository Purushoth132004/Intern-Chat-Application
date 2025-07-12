// js/app.js
const socket = new WebSocket("ws://localhost:3000");
let currentRoom = null;
const username = localStorage.getItem("username");

if (!username) {
  alert("Username not found. Redirecting...");
  window.location.href = "index.html";
}

const messageInput = document.getElementById("message-input");
const messagesContainer = document.getElementById("messages");
const roomList = document.getElementById("room-list");
const currentRoomDisplay = document.getElementById("current-room");

socket.addEventListener("open", () => {
  socket.send(JSON.stringify({ type: "set-username", username }));
  socket.send(JSON.stringify({ type: "get-rooms" }));
});

socket.addEventListener("message", (event) => {
  const data = JSON.parse(event.data);

  switch (data.type) {
    case "message":
      addMessageToChat(data.message);
      break;

    case "room-list":
      updateRoomList(data.rooms);
      break;

    case "notification":
      addNotification(data.text);
      break;

    default:
      console.warn("Unknown message type:", data.type);
  }
});

function sendMessage() {
  const text = messageInput.value.trim();
  if (!text || !currentRoom) return;

  const formatted = formatText(text);
  const message = {
    type: "message",
    room: currentRoom,
    content: formatted,
  };

  socket.send(JSON.stringify(message));
  messageInput.value = "";
}

function addMessageToChat(msg) {
  const messageEl = document.createElement("div");
  messageEl.className = "message";
  messageEl.innerHTML = `<strong>${msg.username}</strong> <span class="timestamp">${formatTime(msg.timestamp)}</span><br>${msg.content}`;
  messagesContainer.appendChild(messageEl);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function addNotification(text) {
  const note = document.createElement("div");
  note.className = "notification";
  note.innerText = text;
  messagesContainer.appendChild(note);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function updateRoomList(rooms) {
  roomList.innerHTML = "";
  rooms.forEach((room) => {
    const li = document.createElement("li");
    li.textContent = room;
    li.onclick = () => joinRoom(room);
    roomList.appendChild(li);
  });
}

function createRoom() {
  const roomName = document.getElementById("new-room").value.trim();
  if (!roomName) return alert("Room name cannot be empty.");
  joinRoom(roomName);
  document.getElementById("new-room").value = "";
}

function joinRoom(room) {
  currentRoom = room;
  currentRoomDisplay.innerText = `Room: ${room}`;
  messagesContainer.innerHTML = "";
  socket.send(JSON.stringify({ type: "join-room", room }));
}

function logout() {
  localStorage.removeItem("username");
  location.href = "index.html";
}
