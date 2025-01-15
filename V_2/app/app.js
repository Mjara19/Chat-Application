// Create WebSocket connection to local server
const socket = new WebSocket('ws://localhost:3000')

// Handle form submission and message sending
function sendMessage(e) {
    // Prevent default form submission
    e.preventDefault()
    // Get input element
    const input = document.querySelector('input')
    // If input has value, send it
    if (input.value) {
        socket.send(input.value)
        // Clear input after sending
        input.value = ""
    }
    // Keep focus on input
    input.focus()
}

// Add submit event listener to form
document.querySelector('form')
    .addEventListener('submit', sendMessage)

// Listen for incoming messages from server
socket.addEventListener("message", ({ data }) => {
    // Create new list item
    const li = document.createElement('li')
    // Set message as text content
    li.textContent = data
    // Add list item to unordered list
    document.querySelector('ul').appendChild(li)
})