// Connexion au serveur WebSocket
const socket = io()

// Éléments du DOM
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// Chargement des templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options de la page récupérées de l'URL
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

// Fonction pour faire défiler automatiquement les messages
const autoscroll = () => {
    // Récupération du dernier message
    const $newMessage = $messages.lastElementChild

    // Calcul de la hauteur du dernier message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Hauteur visible
    const visibleHeight = $messages.offsetHeight

    // Hauteur du conteneur de messages
    const containerHeight = $messages.scrollHeight

    // Calcul de la position de défilement
    const scrollOffset = $messages.scrollTop + visibleHeight

    // Vérification si l'utilisateur était en bas de la page avant l'ajout du dernier message
    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

// Réception des messages textuels du serveur
socket.on('message', (message) => {
    console.log(message)
    // Génération du HTML pour le message textuel
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    // Ajout du message au DOM
    $messages.insertAdjacentHTML('beforeend', html)
    // Faire défiler automatiquement
    autoscroll()
})

// Réception des messages de localisation du serveur
socket.on('locationMessage', (message) => {
    console.log(message)
    // Génération du HTML pour le message de localisation
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    // Ajout du message au DOM
    $messages.insertAdjacentHTML('beforeend', html)
    // Faire défiler automatiquement
    autoscroll()
})

// Réception des données de la salle de chat du serveur
socket.on('roomData', ({ room, users }) => {
    // Mise à jour de la barre latérale avec les données de la salle de chat
    document.querySelector('#sidebar').innerHTML = Mustache.render(sidebarTemplate, {
        room,
        users
    })
})

// Soumission du formulaire de message
$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    // Désactivation temporaire du bouton de soumission
    $messageFormButton.setAttribute('disabled', 'disabled')

    // Récupération du message
    const message = e.target.elements.message.value

    // Émission du message au serveur
    socket.emit('sendMessage', message, (error) => {
        // Réactivation du bouton de soumission
        $messageFormButton.removeAttribute('disabled')
        // Effacement de la zone de saisie et focus
        $messageFormInput.value = ''
        $messageFormInput.focus()

        // Gestion des erreurs
        if (error) {
            return console.log(error)
        }

        // Affichage du message dans l'interface utilisateur
        let d = new Date();
        const html = Mustache.render(messageTemplate, {
            username: username,
            message: message,
            createdAt: moment(d.getTime()).format('h:mm a')
        })
        $messages.insertAdjacentHTML('beforeend', html)
        // Faire défiler automatiquement
        autoscroll()

        console.log('Message delivered!')
    })
})

// Bouton de partage de localisation
$sendLocationButton.addEventListener('click', () => {
    // Vérification de la prise en charge de la géolocalisation par le navigateur
    if (!navigator.geolocation) {
        return alert('La géolocalisation n\'est pas prise en charge par votre navigateur.')
    }

    // Désactivation temporaire du bouton de partage de localisation
    $sendLocationButton.setAttribute('disabled', 'disabled')

    // Récupération de la position géographique
    navigator.geolocation.getCurrentPosition((position) => {
        // Émission de la position au serveur
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            // Réactivation du bouton de partage de localisation
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location shared!')  
        })
    })
})

// Émission de l'événement de connexion à la salle de chat
socket.emit('join', { username, room }, (error) => {
    // Gestion des erreurs de connexion
    if (error) {
        alert(error)
        location.href = '/'
    }
})
