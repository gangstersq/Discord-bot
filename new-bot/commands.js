const { REST, SlashCommandBuilder, Routes } = require('discord.js');
const { client_id, guild_id, token } = require('./config.json');

const commands = [
    new SlashCommandBuilder().setName('whitelistinvitecount').setDescription('whitelist invite links').addStringOption(option =>
        option.setName('invite_links')
            .setDescription('Enter invite links to white list')
            .setRequired(true)),
]
    .map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(token);

rest.put(Routes.applicationGuildCommands(client_id, guild_id), { body: commands })
    .then((data) => console.log(`Successfully registered ${data.length} application commands.`))
    .catch(console.error);