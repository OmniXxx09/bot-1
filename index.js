const { Client, GatewayIntentBits } = require("discord.js");
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Liste des commandes avec leur description
const commands = {
    "!rejoindre": "Le formulaire vous a été envoyé par message privé.",
    "!crewhelp": "Affiche la liste des commandes disponibles.",
    "!ping": "Vérifie le ping du bot.",
    "!rejoindre": "Démarre un quiz interactif."
};

// Tableau des questions du quiz
const quizQuestions = [
    { question: "Quel est votre niveau ?" },
    { question: "Les nombres de primes ?" },
    { question: "Quel est votre choix de flotte ?" },
    { question: "Par qui avez-vous été invité à rejoindre le serveur ?" },
    { question: "Pourquoi avez-vous choisi cette flotte ?" },
    { question: "Informations personnelles (âge, prénom, etc.) [Facultatif]" }
];

client.on("ready", () => {
    console.log("Bot opérationnel");
});

client.on("messageCreate", async (message) => {
    const mentionRegex = new RegExp(`<@!${client.user.id}>|<@${client.user.id}>`);
    const content = message.content.toLowerCase();

    // Ignorer les messages avec "@everyone"
    if (content.includes("@everyone")) return;

    // Vérifier si le message mentionne le bot et contient "présente toi"
    if (mentionRegex.test(content) && (content.includes("présente toi") || content.includes("presente toi"))) {
        message.reply("Salut! Je suis le bot de l'équipage 𝑻𝒉𝒆 𝑪𝒖𝒓𝒔𝒆𝒅 𝑺𝒕𝒂𝒓𝒔 𝑪𝒓𝒆𝒘 et je suis ravi de vous servir.");
    }

    // Vérifier si la commande existe dans la liste
    if (content in commands) {
        // Traiter la commande ici
        const command = content;

        // Vérifier si la commande est !ping
        if (command === "!ping") {
            const pingMessage = `Pong! Latence du bot : ${client.ws.ping} ms.`;
            message.reply(pingMessage);
        }

        // Vérifier si la commande est !crewhelp
        if (command === "!crewhelp") {
            const commandList = Object.keys(commands).join(', ');
            message.reply(`Commandes disponibles : ${commandList}`);
        }

        // Vérifier si la commande est !rejoindre (anciennement !startquiz)
        if (command === "!rejoindre") {
            await startQuiz(message);
        }
    }

    // Vérifier si le message mentionne le bot et contient une salutation
    if (mentionRegex.test(content)) {
        const salutations = ["bonjour", "salut", "hi", "hello", "coucou", "yo", "Yo", "Bonjour", "Salut", "hey", "Hey"];
        
        // Vérifier si le message contient une salutation connue
        const salutation = salutations.find(sal => content.includes(sal));

        if (salutation) {
            message.reply(`${salutation} ! Comment puis-je vous aider aujourd'hui ?`);
        }
    }
});

client.on("guildMemberAdd", (member) => {
    console.log(`${member.user.username} a rejoint le serveur!`);
    welcomeNewMember(member);
});

async function welcomeNewMember(member) {
    const welcomeChannel = member.guild.channels.cache.find(channel => channel.name === '🛫𝐁𝐢𝐞𝐧𝐕𝐞𝐧𝐮e');

    if (welcomeChannel) {
        welcomeChannel.send(`Bienvenue ${member.user.tag} dans le serveur 𝑻𝒉𝒆 𝑪𝒖𝒓𝒔𝒆𝒅 𝑺𝒕𝒂𝒓𝒔 𝑪𝒓𝒆𝒘! N'oubliez pas de consulter les règles.`);
    }
}

async function startQuiz(message) {
    const responseChannelName = "réponses-candidatures"; // Nom du canal où les réponses seront enregistrées

    // Vérifier si le canal de réponse existe
    const responseChannel = message.guild.channels.cache.find(channel => channel.name === responseChannelName);
    if (!responseChannel) {
        return message.reply(`Le canal des réponses '${responseChannelName}' n'a pas été trouvé.`);
    }

    // Message d'introduction du quiz
    message.reply(`Le quiz va commencer ! Répondez dans ce canal.`);

    // Créer un objet pour stocker les réponses par utilisateur
    const userResponses = {};

    // Boucle à travers les questions
    for (let i = 0; i < quizQuestions.length; i++) {
        const questionData = quizQuestions[i];

        // Construire le message de la question
        const questionMessage = `${i + 1}. ${questionData.question}`;

        // Envoyer la question dans le même canal que la commande
        const questionSentMessage = await message.channel.send(questionMessage);

        // Attendre la réponse
        const collected = await message.channel.awaitMessages({ max: 1, time: 30000, errors: ['time'] });

        if (collected.size > 0) {
            const userAnswer = collected.first().content;

            // Stocker la réponse par utilisateur
            if (!userResponses[message.author.id]) {
                userResponses[message.author.id] = [];
            }
            userResponses[message.author.id].push(`Réponse à la question ${i + 1}: ${userAnswer}`);
        } else {
            // Aucune réponse reçue
            await responseChannel.send(`Aucune réponse reçue pour la question ${i + 1} de ${message.author.username}.`);
        }

        // Supprimer la question du canal où la commande a été utilisée
        questionSentMessage.delete().catch(console.error);
    }

    // Stocker les réponses dans le canal de réponses triées par utilisateur
    Object.keys(userResponses).forEach(async (userId) => {
        const user = await client.users.fetch(userId);
        const userAnswerString = userResponses[userId].join('\n');
        await responseChannel.send(`Réponses de ${user.username} :\n${userAnswerString}`);
    });

    // Nettoyer les messages du bot et de l'utilisateur dans le canal où la commande a été utilisée
    const fetchedMessages = await message.channel.messages.fetch({ limit: 10 });
    message.channel.bulkDelete(fetchedMessages);

    // Message de fin du quiz
    message.channel.send("Le quiz est terminé !");
}

client.login("MTIxMDk2NzUzMDcxNDE2OTM2NA.GGux6o.jNL3G639qrURaXo7mE2Jp6a7opcPi0Q8GXm1Cg");
