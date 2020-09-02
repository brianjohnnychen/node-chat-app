// Client
const socket = io() // Connect client to the server using websocket. Client-side websocket is configured in index.html.

// Elements $(Elements from the DOM), $ sign is naming convention.
const $messageForm = document.querySelector("#message-form")
const $messageFormInput = $messageForm.querySelector("input")
const $messageFormButton = $messageForm.querySelector("button")
const $sendLocationButton = document.querySelector("#send-location")
const $messages = document.querySelector("#messages")

// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML
const locationMessageTemplate = document.querySelector("#location-message-template").innerHTML
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true }) // Retrieve URL query string.

// Scroll the user's visible chat window to move with new messages.
const autoscroll = () => {
    // New message element.
    const $newMessage = $messages.lastElementChild

    // Height of the new message.
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height.
    const visibleHeight = $messages.offsetHeight

    // Height of messages container.
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    // Determine if scrolled to bottom prior to new message. Only autoscroll if user at the bottom of the chat window.
    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight // Scroll user to the bottom.
    }
}

socket.on("message", (message) => {
    console.log(message)

    // Pass message into "message" template in index.html
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format("h:mm A")
    })
    $messages.insertAdjacentHTML("beforeend", html)
    autoscroll()
})

socket.on("locationMessage", (message) => {
    console.log(message.url)
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format("h:mm A")
    })
    $messages.insertAdjacentHTML("beforeend", html)
    autoscroll()
})

socket.on("roomData", ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector("#sidebar").innerHTML = html
})

$messageForm.addEventListener("submit", (e) => {
    e.preventDefault()

    // Disable the form to prevent double-clicks and empty messages.
    $messageFormButton.setAttribute("disabled", "disabled")

    const message = e.target.elements.message.value

    socket.emit("sendMessage", message, (error) => {
        // Re-enable the form.
        $messageFormButton.removeAttribute("disabled")
        $messageFormInput.value = ""
        $messageFormInput.focus()

        if (error) {
            return console.log(error)
        }

        console.log("Message delivered.")
    })
})

$sendLocationButton.addEventListener("click", () => {
    if (!navigator.geolocation) {
        return alert("Geolocation is not supported by your browser.")
    }

    // Disable location button while fetching is in process.
    $sendLocationButton.setAttribute("disabled", "disabled")

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit("sendLocation", {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            // Re-enable location button once fetching process is complete.
            $sendLocationButton.removeAttribute("disabled")
            console.log("Location shared!")
        })
    })
})

socket.emit("join", { username, room }, (error) => {
    if (error) {
        alert(error)

        // Send user to the root of the site (join page).
        location.href = "/"
    }
})

// socket.on("countUpdated", (count) => {
//     console.log("The count has been updated.!", count)
// })

// document.querySelector("#increment").addEventListener("click", () => {
//     console.log("Clicked")
//     socket.emit("increment") // Emit an event from the client-side to the button "increment".
// })
