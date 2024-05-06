// Import des dépendances
const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');
const Messages = require('./utils/messages');
const Users = require('./utils/users');

// Classe de l'application de chat
class ChatApp {
    constructor() {
        // Configuration de l'application
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketio(this.server);
        this.port = process.env.PORT || 3000;
        this.publicDirectoryPath = path.join(__dirname, '../public');
        
        // Configuration des fichiers statiques
        this.app.use(express.static(this.publicDirectoryPath));
        
        // Gestion des connexions WebSocket
        this.io.on('connection', this.handleConnection.bind(this));
    }

    // Méthode de gestion des connexions WebSocket
    handleConnection(socket) {
        console.log('Nouvelle connexion WebSocket');
        
        // Gestion de la demande de connexion à une salle de chat
        socket.on('join', this.handleJoin.bind(this, socket));

        // Gestion de l'envoi de message
        socket.on('sendMessage', this.handleSendMessage.bind(this, socket));

        // Gestion de l'envoi de localisation
        socket.on('sendLocation', this.handleSendLocation.bind(this, socket));

        // Gestion de la déconnexion de l'utilisateur
        socket.on('disconnect', this.handleDisconnect.bind(this, socket));
    }

    // Méthode de gestion de la demande de connexion à une salle de chat
    handleJoin(socket, options, callback) {
        const { error, user } = Users.addUser({ id: socket.id, ...options });

        if (error) {
            return callback(error);
        }

        socket.join(user.room);
        socket.emit('message', Messages.generateMessage('Serveur', 'Bienvenue!'));
        socket.broadcast.to(user.room).emit('message', Messages.generateMessage('Admin', `${user.username} a rejoint la salle!`));
        this.io.to(user.room).emit('roomData', { room: user.room, users: Users.getUsersInRoom(user.room) });
        callback();
    }

    // Méthode de gestion de l'envoi de message
    handleSendMessage(socket, message, callback) {
        const user = Users.getUser(socket.id);
        const filter = new Filter();

        if (filter.isProfane(message)) {
            socket.emit('message', Messages.generateMessage('Serveur', 'Les propos inappropriés ne sont pas autorisés!'));
            return callback('Les propos inappropriés ne sont pas autorisés!');
        }

        socket.broadcast.to(user.room).emit("message", Messages.generateMessage(user.username, message));
        callback();
    }

    // Méthode de gestion de l'envoi de localisation
    handleSendLocation(socket, coords, callback) {
        const user = Users.getUser(socket.id);
        this.io.to(user.room).emit('locationMessage', Messages.generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`));
        callback();
    }

    // Méthode de gestion de la déconnexion de l'utilisateur
    handleDisconnect(socket) {
        const user = Users.removeUser(socket.id);

        if (user) {
            this.io.to(user.room).emit('message', Messages.generateMessage('Admin', `${user.username} a quitté la salle!`));
            this.io.to(user.room).emit('roomData', { room: user.room, users: Users.getUsersInRoom(user.room) });
        }
    }

    // Méthode pour démarrer le serveur
    startServer() {
        this.server.listen(this.port, () => {
            console.log(`Le serveur est démarré sur le port ${this.port}!`);
        });
    }
}

// Création de l'instance de l'application de chat
const chatApp = new ChatApp();

// Démarrage du serveur
chatApp.startServer();
