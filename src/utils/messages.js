// Classe pour la génération de messages
class MessageGenerator {
    // Méthode pour générer un message texte
    generateMessage(username, text) {
        return {
            username,
            text,
            createdAt: new Date().getTime()
        };
    }

    // Méthode pour générer un message de localisation
    generateLocationMessage(username, url) {
        return {
            username,
            url,
            createdAt: new Date().getTime()
        };
    }
}

// Export de la classe MessageGenerator
module.exports = MessageGenerator;
