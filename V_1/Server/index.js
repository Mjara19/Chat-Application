// Import WebSocket
const ws = require('ws')
// Create WebSocket server
const server = new ws.Server({ port: '3000'})

// Handle client connections
server.on('connection', socket => {
    // Handle incoming messages
    socket.on('message' , message => {
        const b = Buffer.from(message)
        console.log(b.toString())
        socket.send(`${message}`)
    })
})