// Classe pour la gestion des utilisateurs
class UsersManager {
    constructor() {
        this.users = [];
    }

    // Méthode pour ajouter un utilisateur
    addUser({ id, username, room }) {
        username = username.trim().toLowerCase();
        room = room.trim().toLowerCase();

        if (!username || !room) {
            return { error: 'Le nom d\'utilisateur et la salle sont requis!' };
        }

        const existingUser = this.users.find(user => user.room === room && user.username === username);

        if (existingUser) {
            return { error: 'Le nom d\'utilisateur est déjà utilisé!' };
        }

        const user = { id, username, room };
        this.users.push(user);
        return { user };
    }

    // Méthode pour supprimer un utilisateur
    removeUser(id, room) {
        const index = this.users.findIndex(user => user.id === id && user.room === room);

        if (index !== -1) {
            return this.users.splice(index, 1)[0];
        }
    }

    // Méthode pour récupérer un utilisateur par son ID
    getUser(id) {
        return this.users.find(user => user.id === id);
    }

    // Méthode pour récupérer tous les utilisateurs dans une salle donnée
    getUsersInRoom(room) {
        room = room.trim().toLowerCase();
        return this.users.filter(user => user.room === room);
    }
}

// Export de la classe UsersManager
module.exports = UsersManager;
