const {MessageEmbed} = require('discord.js');
const config = require('../../config.json');
const { Database } = require('../../src/db/db');
const ignorechannel = require('../../ignorechannel.json');

const database = new Database;

var c = config.auditTypes;
var gid = '';

function auditLog(bot) {

    bot.on(c.messagedelete, message => sendToAudit(bot, c.messagedelete, message));

    bot.on(c.channelcreate, channel => sendToAudit(bot, c.channelcreate, channel));

    bot.on(c.channeldelete, channel => sendToAudit(bot, c.channeldelete, channel));

    bot.on(c.channelupdate, (oldchannel, newchannel) => sendToAudit(bot, c.channelupdate, oldchannel, newchannel));

    bot.on(c.debug, info => sendToAudit(bot, c.debug, info));

    bot.on(c.disconnect, event => sendToAudit(bot, c.debug, event));

    bot.on(c.reconnecting, event => sendToAudit(bot, c.reconnecting, event));

    bot.on(c.error, err => sendToAudit(bot, c.error, err));

    bot.on(c.warn, warn => sendToAudit(bot, c.warn, warn));

    bot.on(c.guildupdate, (oldguild, newguild) => sendToAudit(bot, c.guildupdate, oldguild, newguild));

    bot.on(c.messagedeletebulk, messages => sendToAudit(bot, c.messagedeletebulk, messages));

    bot.on(c.messageupdate, (oldmessage, newmessage) => sendToAudit(bot, c.messageupdate, oldmessage, newmessage));

    bot.on(c.rolecreate, role => sendToAudit(bot, c.rolecreate, role));

    //bot.on(c.roleupdate, (oldrole, newrole) => sendToAudit(bot, c.roleupdate, oldrole, newrole));

    bot.on(c.roledelete, role => sendToAudit(bot, c.roledelete, role));
}

function sendToAudit(bot, type, content1, content2) {
    
    if(ignorechannel.c.indexOf(content1.channelId) !== -1) return;

    var Message = new MessageEmbed()
    .setTimestamp();

    switch(type) {

        case c.debug:
            Message.setDescription(`**Debug info: ** \n ${content1}`);
            break;

        case c.disconnect:
            Message.setDescription(`**WebSocket disconnected! ** \n ${content1}`);
            break;
        
        case c.reconnecting:
            Message.setDescription(`**WebSocket reconnecting! ** \n ${content1}`);
            break;

        case c.error:
            Message.setDescription(`**ERROR ** \n ${content1}`);
            break;

        case c.warn:
            Message.setDescription(`**WARN ** \n ${content1}`);
            break;


        case c.messagedeletebulk:
            if (!content1.guild) return
            if (content1.author.bot) return;

            gid = content1.guildId
            Message.setAuthor(`${content1.author.username}#${content1.author.discriminator}`)
            Message.setDescription(`**Bulkmessages sent by <@${content1.author.id}> deleted in <#${content1.channelId}>** \n ${content1}`);
            Message.setFooter(`Author: ${content1.author.id} | MessageID: ${content1.id}`);
            break;

        case c.messagedelete:
            if (!content1.guild) return
            if (content1.author.id === bot.user.id) return;
            if (content1.author.bot) return;
            gid = content1.guildId
            Message.setAuthor(`${content1.author.username}#${content1.author.discriminator}`)
            Message.setDescription(`**Message sent by <@${content1.author.id}> deleted in <#${content1.channelId}>** \n ${content1}`);
            Message.setFooter(`Author: ${content1.author.id} | MessageID: ${content1.id}`);
            break;

        case c.messageupdate:
            if (!content1.guild) return
            if (content1.author.id === bot.user.id) return;
            if (content1.author.bot) return;
            gid = content1.guildId
            Message.setAuthor(`${content1.author.username}#${content1.author.discriminator}`)
            Message.setDescription(`**Message edited in <#${content1.channelId}> [Jump to Message](https://discord.com/channels/${content2.guildId}/${content2.channelId}/${content2.id})** \n **Before** \n ${content1} \n **After** \n ${content2}`);
            break;
            
        case c.channelcreate:
            gid = content1.guildId
            Message.setDescription(`**Channel ${content1} created**`);
            break;

        case c.channeldelete:
            gid = content1.guildId
            Message.setDescription(`**Channel #${content1.name} deleted**`);
            break;

        case c.channelupdate:
            gid = content2.guildId
            Message.setDescription(`**Channel ${content2} updated** `);
            break;

        case c.guildupdate:
            gid = content2.guildId
            Message.setDescription(`**Guild updated** \n ${content1} ---> ${content2}`);
            break;

        case c.rolecreate:
            gid = content1.guildId
            Message.setDescription(`**Role ${content1} created**`);
            break;

        case c.roleupdate:
            gid = content2.guildId
            Message.setDescription(`**Role ${content2} updated** \n **Before** \n ${content1} \n **After** \n ${content2}`);
            break;

        case c.rolecreate:
            gid = content1.guildId
            Message.setDescription(`**Role ${content1} deleted**`);
            break;
        

    }

    if(type === c.debug) {
        return bot.guilds.cache.get(config.DEVELOPER_DISCORD_GUILD_ID).channels.cache.get(config.defaultChannels.DEV_SERVER.debugchannel).send({embeds: [Message]});
    }else if(type === c.disconnect) {
        return bot.guilds.cache.get(config.DEVELOPER_DISCORD_GUILD_ID).channels.cache.get(config.defaultChannels.DEV_SERVER.disconnectchannel).send({embeds: [Message]});
    }else if(type === c.error) {
        return bot.guilds.cache.get(config.DEVELOPER_DISCORD_GUILD_ID).channels.cache.get(config.defaultChannels.DEV_SERVER.errorchannel).send({embeds: [Message]});
    }else if(type === c.warn) {
        return bot.guilds.cache.get(config.DEVELOPER_DISCORD_GUILD_ID).channels.cache.get(config.defaultChannels.DEV_SERVER.warnchannel).send({embeds: [Message]});
    }else if(type === c.reconnecting) {
        return bot.guilds.cache.get(config.DEVELOPER_DISCORD_GUILD_ID).channels.cache.get(config.defaultChannels.DEV_SERVER.reconnectingchannel).send({embeds: [Message]});
    }

    database.query(`SELECT * FROM ${gid}_guild_logs`).then(res => {
        logs = res[0];
        if(type === c.messageupdate && logs.messagelog !== null) {
            return bot.channels.cache.get(logs.messagelog).send({embeds: [Message]})
        }else {
            if(logs.auditlog !== null) {
                return bot.channels.cache.get(logs.auditlog).send({embeds: [Message]})
            }
        }
    }).catch(err => {
        //NO GUILD LOGS OR NO GUILD ID
    })
    return;
}

module.exports = {auditLog};