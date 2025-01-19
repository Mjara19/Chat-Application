// Initialize socket connection
const socket = io('ws://localhost:3500')

// Get DOM elements
const messageInput = document.querySelector('#message')
const usernameInput = document.querySelector('#name')
const roomInput = document.querySelector('#room')
const typingStatus = document.querySelector('.activity')
const userList = document.querySelector('.user-list')
const roomList = document.querySelector('.room-list')
const chatMessages = document.querySelector('.chat-display')

// Send chat message
function sendMessage(event) {
    event.preventDefault()
    if (usernameInput.value && messageInput.value && roomInput.value) {
        socket.emit('message', {
            name: usernameInput.value,
            text: messageInput.value
        })
        messageInput.value = ""
    }
    messageInput.focus()
}

// Join chat room
function joinRoom(event){
    event.preventDefault()
    if (usernameInput.value && roomInput.value){
        socket.emit('enterRoom', {
            name: usernameInput.value,
            room: roomInput.value
        })
    }
}

// Event listeners for forms
document.querySelector('.form-msg')
    .addEventListener('submit', sendMessage)

document.querySelector('.form-join')
    .addEventListener('submit', joinRoom)

// Typing indicator
messageInput.addEventListener('keypress', ()=>{
    socket.emit('activity', usernameInput.value)
})

// Generate consistent color based on username
function generateUserColor(username) {
    let colorSeed = 0;
    for (let i = 0; i < username.length; i++) {
        colorSeed = username.charCodeAt(i) + ((colorSeed << 5) - colorSeed);
    }
    
    const hueValue = colorSeed % 360;
    return `hsl(${hueValue}, 70%, 45%)`;
}

// Handle incoming messages
socket.on("message", (payload) => {
    typingStatus.textContent = ""
    const {name, text, time} = payload
    const messageElement = document.createElement('li')
    messageElement.className = 'post'
    if(name === usernameInput.value) messageElement.className = 'post post--left'
    if(name !== usernameInput.value && name !== 'Admin') messageElement.className = 'post post--right'
    
    if(name !== 'Admin') {
        const participantColor = generateUserColor(name);
        messageElement.innerHTML = `<div class="post__header ${name === usernameInput.value ? 'post__header--user' : 'post__header--reply'}" style="background-color: ${participantColor}">
        <span class="post__header--name">${name}</span>    
        <span class="post__header--time">${time}</span>
        </div>
        <div class="post__text">${text}</div>`
    } else {
        messageElement.innerHTML = `<div class="post__text">${text}</div>`
    }
    
    document.querySelector('.chat-display').appendChild(messageElement)
    chatMessages.scrollTop = chatMessages.scrollHeight
})

// Typing indicator timeout
let typingTimeout 

// Handle typing activity
socket.on("activity", (username)=>{
    typingStatus.textContent = `${username} is typing...`

    clearTimeout(typingTimeout)
    typingTimeout = setTimeout(()=>{
        typingStatus.textContent = ""
    },3000)
})

// Update user list
socket.on('userList', ({users}) => {
    displayParticipants(users)
})

// Update room list
socket.on('roomList', ({rooms}) => {
    displayActiveRooms(rooms)
})

// Display participants in current room
function displayParticipants(participants) {
    userList.textContent = ''
    if (participants) {
        userList.innerHTML = `<em>Users in ${roomInput.value}: </em> ` 
        participants.forEach((participant, idx) => {
            const memberColor = generateUserColor(participant.name);
            userList.innerHTML += `<span style="color: ${memberColor}">${participant.name}</span>`
            if(participants.length > 1 && idx !== participants.length - 1) {
                userList.innerHTML += ', '
            }
        })
    }
}

// Display list of active rooms
function displayActiveRooms(availableRooms) {
    roomList.textContent = ''
    if (availableRooms) {
        roomList.innerHTML = '<em>Active Rooms:</em>'
        availableRooms.forEach((chatRoom, idx) => {
            roomList.textContent += ` ${chatRoom}`
            if (availableRooms.length > 1 && idx !== availableRooms.length - 1) {
                roomList.textContent += ","
            }
        })
    }
}
