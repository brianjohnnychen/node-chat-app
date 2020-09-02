const path = require("path")
const http = require("http")
const express = require("express")
const socketio = require("socket.io")
const Filter = require("bad-words")
const { generateMessage, generateLocationMessage } = require("./utils/messages")
const { addUser, removeUser, getUser, getUsersInRoom } = require("./utils/users")

// Set up a new Express server.
const app = express()
const server = http.createServer(app)
const io = socketio(server) // Configure socket io to work with given server.

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, "../public")

app.use(express.static(publicDirectoryPath))

// Server-side of socket io.
io.on("connection", (socket) => {
    console.log("New websocket connection.")

    socket.on("join", ({ username, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, username: username, room: room })

        if (error) {
            return callback(error) // Stop function execution and return error to client.
        }

        // Allow users to join a given chat room. ('join' is only useable on server)
        socket.join(user.room)

        socket.emit("message", generateMessage("SYSTEM", "Welcome! (from the server)")) // Send message to individual clients.
        socket.broadcast.to(user.room).emit("message", generateMessage(`${user.username} has joined!`)) // Emits event to everybody in a specific room.
        io.to(user.room).emit("roomData", {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback() // Call without error to let client know they were able to join.
        /**
         * socket.emit, io.emit, socket.broadcast.emit
         * io.to.emit, socket.broadcast.to.emit
         */
    })

    socket.on("sendMessage", (message, callback) => {
        const user = getUser(socket.id) // Get the user that is sending the message.
        const room = user.room

        const filter = new Filter()

        // Deny messages containing profanity.
        if (filter.isProfane(message)) {
            return callback("Profanity is not allowed!")
        }

        io.to(room).emit("message", generateMessage(user.username, message)) // io.emit sends to all clients instead of one.
        callback() // Event acknowledgement.
        // callback("Delivered!") // Can also take parameters to send back to client.
    }) // Receive message from clients.

    socket.on("sendLocation", (coords, callback) => {
        const user = getUser(socket.id)
        const room = user.room

        // io.emit("locationMessage", `https://google.com/maps?q=${coords.latitude},${coords.longitude}`)
        io.to(room).emit("locationMessage", generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback() // Event acknowledgement.
    })

    socket.on("disconnect", () => {
        const user = removeUser(socket.id) // Returns either user object on success or undefined if removal failed.

        if (user) {
            io.to(user.room).emit("message", generateMessage("SYSTEM", `${user.username} has left!`))
            io.to(user.room).emit("roomData", {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    }) // Listen for user disconnect.

    // socket.emit("countUpdated", count) // Send an event from the server to the client. Anything sent through emit after first argument is available on the callback function on the client.
    // socket.on("increment", () => {
    //     count++
    //     // socket.emit("countUpdated", count) // Emit to specific connection.
    //     io.emit("countUpdated", count) // Emit to every connection available.
    // }) // Listen to an event called listen from clients.
})

// Listen to server to start up http server.
server.listen(port, () => {
    console.log(`Server is up on port ${port}!`)
})

