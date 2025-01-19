import express from 'express'
import { Server } from "socket.io"
import path from 'path'
import { fileURLToPath } from 'url'

const currentFilename = fileURLToPath(import.meta.url)
const currentDirectory = path.dirname(currentFilename)

const SERVER_PORT = process.env.PORT || 3500
const ADMIN_NAME = "Admin"
const expressApp = express()

expressApp.use(express.static(path.join(currentDirectory, "public")))

const httpServer = expressApp.listen(SERVER_PORT, () => {
    console.log(`listening on port ${SERVER_PORT}`)
})

//state
const ChatParticipants = {
    participants: [],
    setParticipants: function(newParticipantsArray){
        this.participants = newParticipantsArray
    }
}

const socketServer = new Server(httpServer, {
    cors: {
        origin: process.env.NODE_ENV === "production" ? false : ["http://localhost:5500", "http://127.0.0.1:5500"]
    }
})

// Handle new socket connections
socketServer.on('connection', clientSocket => {
    // Log when a new user connects
    console.log(`User ${clientSocket.id} connected`)

    // Send welcome message to newly connected user
    clientSocket.emit('message', createChatMessage(ADMIN_NAME, "Welcome to Chat Application!"))

    // Handle user entering a chat room
    clientSocket.on('enterRoom', ({name, room}) => {
        // Check if user was in a previous room
        const previousRoom = findParticipant(clientSocket.id)?.room
        if (previousRoom){
            // Leave previous room and notify other users
            clientSocket.leave(previousRoom)
            socketServer.to(previousRoom).emit('message', createChatMessage(ADMIN_NAME, `${name} has left the room`))
        }

        // Add user to new room
        const participant = addParticipant(clientSocket.id, name, room)

        // Update user list for previous room if exists
        if (previousRoom){
            socketServer.to(previousRoom).emit('userList',{
                users: getParticipantsInRoom(previousRoom),
            })
        }

        // Join new room
        clientSocket.join(participant.room)

        // Send confirmation message to user
        clientSocket.emit('message', createChatMessage(ADMIN_NAME, `You have joined the ${participant.room} chat room`))

        // Notify other users in room about new user
        clientSocket.broadcast.to(participant.room).emit('message', createChatMessage(ADMIN_NAME, `${participant.name} has joined the chat room`))

        // Update user list for current room
        socketServer.to(participant.room).emit('userList', {
            users: getParticipantsInRoom(participant.room)
        })

        // Update list of active rooms for all users
        socketServer.emit('roomList', {
            rooms: getActiveRooms()
        })
    })

    clientSocket.on('disconnect', ()=>{
        const participant = findParticipant(clientSocket.id)
        removeParticipant(clientSocket.id)
        if(participant){
            socketServer.to(participant.room).emit('message', createChatMessage(ADMIN_NAME, `${participant.name} has left the chat room`))
            socketServer.to(participant.room).emit('userList', {
                users: getParticipantsInRoom(participant.room)
            })
            socketServer.emit('roomList', {
                rooms: getActiveRooms()
            })
        }

        console.log(`User ${clientSocket.id} disconnected`)

    })


    //Listen for new messages
    clientSocket.on('message', ({name, text}) => {
        const currentRoom = findParticipant(clientSocket.id)?.room
        if(currentRoom){
            socketServer.to(currentRoom).emit('message', createChatMessage(name, text))
        }
    })

    //Listen for user activity
    clientSocket.on('activity', (name)=>{
        const currentRoom = findParticipant(clientSocket.id)?.room
        if(currentRoom){
            clientSocket.broadcast.to(currentRoom).emit('activity', name)
        }
    })
})

//Build message function
function createChatMessage(name, text){
    return {
        name,
        text,
        time: new Intl.DateTimeFormat('default', {
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric'
        }).format(new Date())
    }
}

//User's functions

function addParticipant(id, name, room){
    const participant = {id, name, room}
    ChatParticipants.setParticipants([
        ...ChatParticipants.participants.filter(user => user.id !== id), 
        participant
    ])
    return participant
}

function removeParticipant(id){
    ChatParticipants.setParticipants(ChatParticipants.participants.filter(user => user.id !== id))
}

function findParticipant(id){
    return ChatParticipants.participants.find(user => user.id === id)
}

function getParticipantsInRoom(room){
    return ChatParticipants.participants.filter(user => user.room === room)
}

function getActiveRooms(){
    return Array.from(new Set(ChatParticipants.participants.map(user => user.room)))
}
