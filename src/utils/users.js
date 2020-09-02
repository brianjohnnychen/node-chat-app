const users = []

// addUser - track a new user.
// removeUser - stop tracking a user when the user leaves.
// getUser - fetch an existing user's data.
// getUsersInRoom - get a list of all users in a specific room.

const addUser = ({ id, username, room }) => {
    // Clean the data.
    username = username.trim().toLowerCase()
    room = room.trim().toLowerCase()

    // Validate the data.
    if (!username || !room) {
        return {
            error: "Username and room are required."
        }
    }

    // Check for existing user.
    const existingUser = users.find((user) => {
        return user.room === room && user.username === username
    })

    // Validate username.
    if (existingUser) {
        return {
            error: "Username is in use."
        }
    }

    // Store user if no error.
    const user = { id, username, room }
    users.push(user)
    return { user }
}

const removeUser = (id) => {
    const index = users.findIndex((user) => {
        return user.id === id
    }) // index will be -1 if user not found. FindIndex is faster than filter().

    if (index !== -1) {
        return users.splice(index, 1)[0] // Remove the user at the index and return the user that was removed.
    }
}

const getUser = (id) => {
    return users.find((user) => user.id === id)
}

const getUsersInRoom = (room) => {
    return users.filter((user) => {
        room = room.trim().toLowerCase()
        return user.room === room
    })
}

module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
}