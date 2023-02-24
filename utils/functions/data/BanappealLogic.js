const { EmbedBuilder } = require('discord.js');
const { errorhandler } = require('../errorhandler/errorhandler');

module.exports = class BanappealLogic {
    constructor() {}

    sendBanappealToUser(guild_id, user_id) {
        return new Promise(async (resolve, reject) => {
            const settings = await this.getSettings(guild_id);
            if (!settings) {
                return reject(false);
            }

            const user = await this.bot.users.fetch(user_id);
            if (!user) {
                return reject(false);
            }

            const guild = await this.bot.guilds.fetch(guild_id);
            if (!guild) {
                return reject(false);
            }

            settings.title = settings.title.replace(
                '{user}',
                `${user.username}#${user.discriminator}`
            );
            settings.description = settings.description.replace(
                '{user}',
                `${user.username}#${user.discriminator}`
            );

            settings.title = settings.title.replace('{guild}', guild.name);
            settings.description = settings.description.replace('{guild}', guild.name);

            for (let i in settings.questions) {
                settings.questions[i] = settings.questions[i].replace(
                    '{user}',
                    `${user.username}#${user.discriminator}`
                );
                settings.questions[i] = settings.questions[i].replace('{guild}', guild.name);
            }

            const title = settings.title;
            const description = settings.description;
            const questions = settings.questions;

            const embed = new EmbedBuilder().setTitle(title).setDescription(description);

            for (let i in questions) {
                embed.addFields({
                    name: `Question ${parseInt(i) + 1}`,
                    value: questions[i],
                });
            }

            await user
                .send({
                    content: `||${guild_id}|| ‼️ Please fill the answers to the questions below in **ONE** Message and **REPLY** to the bots Message, or the bot can't see for which Guild you are requesting the unban. The Bot will send the first message you send.`,
                    embeds: [embed],
                })
                .catch((err) => {
                    // User has DMs disabled
                    reject(false);
                })
                .finally(() => {
                    resolve(true);
                });
        });
    }

    getBanAppealMessage(message) {
        return new Promise(async (resolve, reject) => {
            const repliedMessage = message.reference ? message.reference : null;

            if (!repliedMessage) {
                return reject(false);
            }

            const fetchedMessage = await this.bot.channels
                .fetch(repliedMessage.channelId)
                .then((channel) => {
                    return channel.messages.fetch(repliedMessage.messageId);
                })
                .catch((err) => {
                    return false;
                });

            if (!fetchedMessage) {
                return reject(false);
            }

            const guild_id = fetchedMessage.content.split('||')[1];
            if (!guild_id) {
                return reject(false);
            }

            resolve(guild_id);
        });
    }

    sendAppealToAdmins(guild_id, user_id) {
        return new Promise(async (resolve, reject) => {
            const settings = await this.getSettings(guild_id);
            if (!settings) {
                return reject(false);
            }

            const guild = await this.bot.guilds.fetch(guild_id);
            if (!guild) {
                return reject(false);
            }

            const banappeal = await this.getBanappeal(guild_id, user_id);
            if (!banappeal) {
                return reject(false);
            }

            const user = await this.bot.users.fetch(user_id);

            const answers = banappeal.appeal_msg;

            const embed = new EmbedBuilder()
                .setTitle(
                    `New Banappeal from ${
                        user ? `${user.username}#${user.discriminator}` : `${user_id}`
                    }`
                )
                .setColor('#ff0000');
            if (user) {
                embed.setThumbnail(user.displayAvatarURL());
            }

            embed.addFields({
                name: `Answer:`,
                value: `${answers}`,
            });

            const channel = await this.bot.channels.fetch(settings.channel_id);
            await channel
                .send({
                    embeds: [embed],
                })
                .catch((err) => {
                    // The channel is not available or the bot does not have permissions to send messages
                });

            resolve(true);
        });
    }

    cleanUserInput(message) {
        // remove all suspicious characters from the message to prevent SQL injections
        return message.replace(/[^a-zA-Z0-9 ]/g, '');
    }
};
