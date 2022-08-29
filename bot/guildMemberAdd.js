const {
    giveAllRoles
} = require("../utils/functions/roles/giveAllRoles");
const {
    errorhandler
} = require('../utils/functions/errorhandler/errorhandler');
const database = require('../src/db/db');
const {
    insertMemberInfo,
    getMemberInfoById,
    updateMemberInfoById
} = require('../utils/functions/data/getMemberInfo');
const {
    sendWelcomeMessage
} = require('../utils/functions/data/welcomechannel');
const {
    getGuildConfig
} = require("../utils/functions/data/getConfig");
const {
    getJoinroles
} = require("../utils/functions/data/joinroles");

async function guildMemberAdd(member, bot) {

    var {
        settings
    } = await getGuildConfig({
        guild_id: member.guild.id,
    });

    disabled_modules = JSON.parse(settings.disabled_modules);

    if (disabled_modules.indexOf('welcomemessage') === -1) {
        sendWelcomeMessage({
            guild_id: member.guild.id,
            bot,
            joined_user: member
        }).catch(err => {})
    }

    const memberInfo = await getMemberInfoById({
        guild_id: member.guild.id,
        user_id: member.id
    })
    if (memberInfo.error) return;

    //? If memberInfo is empty, insert new member info
    else if (!memberInfo) {
        await insertMemberInfo({
            guild_id: member.guild.id,
            user_id: member.user.id,
            user_joined: new Date().getTime(),
            member_roles: "[]"
        })
    }

    //?If no join date is set, set it to the current date
    if (memberInfo.user_joined == null) {
        await updateMemberInfoById({
            guild_id: memberInfo.guild_id,
            user_id: memberInfo.user_id,
            user_joined: new Date().getTime(),
        })
    }


    await database.query(`SELECT * FROM open_infractions WHERE user_id = ? AND guild_id = ? AND mute = ?`, [member.user.id, member.guild.id, 1]).then(async inf => {
        if (await inf.length !== 0) {
            member.roles.add([member.guild.roles.cache.find(r => r.name === 'Muted')]).catch(err => {});
        } else {
            let user_roles = await memberInfo.member_roles;
            if (!user_roles) return;

            user_roles = JSON.parse(user_roles);

            //? IF MUTED ROLE IS IN USERS DATASET -> MUTED ROLE WILL BE REMOVED
            const indexOfMuteRole = user_roles.indexOf(member.guild.roles.cache.find(r => r.name === 'Muted').id)
            if (user_roles !== null && indexOfMuteRole !== -1) {
                user_roles = await user_roles.filter(r => r !== member.guild.roles.cache.find(r => r.name === 'Muted').id)
            }
            setTimeout(async () => {
                if (user_roles) await giveAllRoles(member.id, member.guild, user_roles);
            }, 2000);
        }
    }).catch(err => {
        return errorhandler({
            err,
            fatal: true
        })
    });

    if (!member.user.bot) {

        const joinroles = getJoinroles({
            guild_id: member.guild.id
        })

        if (joinroles.length == 0) return;

        for (let i in joinroles) {
            let j_role = await member.guild.roles.cache.find(r => r.id === joinroles[i]);
            try {
                await member.roles.add(j_role).catch(err => {})
            } catch (err) {
                //NO PERMISSONS
                return
            }
        }
        errorhandler({
            err: null,
            fatal: false,
            message: `I have added the join roles to ${member.user.username} in ${member.guild.name}`
        })
    }
}

module.exports = {
    guildMemberAdd
}