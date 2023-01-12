const { token, admin_role_id } = require('./config.json')
const { Client, EmbedBuilder, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const bot = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages, GatewayIntentBits.GuildInvites, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const { createLogger, format, transports } = require("winston");


const error_logger = createLogger({
    format: format.combine(format.timestamp(), format.json()),
    transports: [new transports.File({ filename: "./logs/error.log" })],
});
const entry_logger = createLogger({
    format: format.combine(format.timestamp(), format.json()),
    transports: [new transports.File({ filename: "./logs/entries.log" })],
});


//connecting bot
bot.on('ready', async () => {
    console.log(`Logged in as ${bot.user.tag}!`);
});
bot.login(token)


// Handling slashCommands
bot.on('interactionCreate', async (interaction) => {

    if (interaction.user.bot) return;
    if (interaction.commandName === 'whitelistinvitecount') {
        await interaction.deferReply()
        const isRoleAvailable = await interaction.member._roles.find(v => v === admin_role_id)
        if (!isRoleAvailable) return await interaction.editReply({ content: 'Restricted Command' })
        const received_invite_codes = await (interaction.options._hoistedOptions[0].value).split(',').map(v => v.split('https://discord.gg/')[1])
        const file = await JSON.parse(fs.readFileSync('./inviteData.json'))
        await received_invite_codes
            .map(async (v) => {
                try {
                    const isAvailable = file.whitelisted_invite_codes.find(({ code }) => code === v)
                    if (isAvailable) return console.log(v, " whitelisted already");
                    const invite_data = await interaction.guild.invites.fetch(v)
                    file['whitelisted_invite_codes'].push({
                        code: invite_data.code,
                        created_at: invite_data.createdTimestamp,
                        expires_on: invite_data._expiresTimestamp,
                        uses: invite_data.uses,
                        inviterId: invite_data.inviterId,
                        role: ''
                    })
                    fs.writeFileSync('./inviteData.json', JSON.stringify(file))
                    return
                } catch (error) {
                    error_logger.error(
                        `While whitelisting: ${interaction.member.user.username}-->${interaction.member.user.id}-->${interaction.options._hoistedOptions[0].value}-->${error.message ? error.message : error}`
                    )
                }
            })
        return await interaction.editReply({ content: 'Whitelisted the Invite Codes Successfully' })
    }
})

//Handling member add to guild
bot.on('guildMemberAdd', async (member) => {
    try {
        const file = await JSON.parse(fs.readFileSync('./inviteData.json'))
        const available_invites = (await member.guild.invites.fetch()).map(v => v);
        let index = 0;
        await file.whitelisted_invite_codes
            .map(async (e) => {
                const common_invite = available_invites.find(({ code }) => code === e.code)
                if (common_invite.uses > e.uses) {
                    file['whitelisted_invite_codes'][index]['uses'] = common_invite.uses
                    fs.writeFileSync('./inviteData.json', JSON.stringify(file))
                    const role = member.guild.roles.cache.find(role => role.name === e.role);
                    console.log("role: ", role);
                    if (role) await member.roles.add(role).catch((error) => console.error('errrrr: ', error));
                    const link_exp_time = (new Date(e.expires_on)).toLocaleString()
                    console.log("time: ", link_exp_time);

                    const exampleEmbed = new EmbedBuilder()
                        .setColor(0x0099FF)
                        .setTitle('New User Added')
                        // .setURL('https://discord.js.org/') // add website url for re-directing
                        .setAuthor({ name: 'Gangster Queens', iconURL: 'https://cdn.discordapp.com/icons/1048990512822112286/ea58b661870f5297a76ec21406fd1415.png' })
                        .setDescription('User Details')
                        // .setThumbnail('https://i.imgur.com/AfFp7pu.png')
                        .addFields(
                            { name: 'User Tag', value: `**${member.user.tag}**` },
                            { name: '\u200B', value: '\u200B' },
                            { name: 'Invite code', value: `**${e.code}**`, inline: true },
                            { name: 'Invite code used', value: `**${common_invite.uses}** times` },
                            { name: 'Invite code Expires on', value: `**${link_exp_time}**` },
                        )
                    return await (await bot.users.fetch(e.inviterId)).send({ embeds: [exampleEmbed] });
                }
                index++;
            })
    } catch (error) {
        error_logger.error(
            `While adding member: ${member.user.username}-->${member.user.id}-->${error.message ? error.message : error}`
        )
    }
})


// bot.on('messageCreate', async (message) => {
//     // const role = message.member.guild.roles.cache.find(role => role.name === "new role");
//     // console.log("role: ", role);
//     // await message.member.roles.add(role).catch((error) => console.error('errrrr: ', error));
//     console.log(await message.guild.invites.fetch('pCtzP73J'));
// })

// bot.on('inviteCreate', (invite) => {
//     console.log('invite', invite);
// })

// bot.on('inviteDelete', (invite) => {
//     console.log('invite', invite);
// })