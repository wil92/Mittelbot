const config = require('~assets/json/_config/config.json');
const { setNewModLogMessage } = require('~utils/functions/modlog/modlog');
const { privateModResponse } = require('~utils/functions/privatResponses/privateModResponses');
const { giveAllRoles } = require('~utils/functions/roles/giveAllRoles');
const { removeMutedRole } = require('~utils/functions/roles/removeMutedRole');
const { saveAllRoles } = require('~utils/functions/roles/saveAllRoles');
const { errorhandler } = require('~utils/functions/errorhandler/errorhandler');
const Infractions = require('~utils/classes/Infractions');

const interval = 1000 * 60; // 1 Minute

module.exports.checkInfractions = (bot) => {
    console.info('🔎📜 CheckInfraction handler started');
    setInterval(async () => {
        const results = await new Infractions().getAllOpen();

        let done = 0;
        let mutecount = 0;
        let bancount = 0;
        for (let i in results) {
            if (results[i].till_date == null) continue;

            const currentdate = new Date().getTime();
            const till_date = results[i].till_date.getTime();

            const currentYear = new Date().getFullYear();
            const infYear = results[i].till_date.getFullYear();
            if (currentdate - till_date >= 0 && currentYear <= infYear) {
                if (results[i].mute) {
                    const guild = await bot.guilds.cache.get(results[i].guild_id);
                    const user = await guild.members
                        .fetch(results[i].user_id)
                        .then((members) => {
                            return members;
                        })
                        .catch(async () => {
                            return await bot.users.cache.get(results[i].user_id);
                        });
                    try {
                        await removeMutedRole(user, bot.guilds.cache.get(results[i].guild_id));

                        if (user) {
                            await giveAllRoles(
                                results[i].user_id,
                                guild,
                                results[i].user_roles,
                                bot
                            );
                        }

                        await saveAllRoles(results[i].user_roles || null, user, guild);

                        await setNewModLogMessage(
                            bot,
                            config.defaultModTypes.unmute,
                            bot.user.id,
                            user ? user.id : results[i].user_id,
                            'Auto',
                            null,
                            results[i].guild_id
                        );

                        await privateModResponse({
                            member: user ? user.id : results[i].user_id,
                            type: config.defaultModTypes.unmute,
                            reason: 'Auto',
                            bot,
                            guildname: guild.name,
                        });

                        await new Infractions().moveFromOpenToClosed(results[i]);
                    } catch (err) {
                        errorhandler({
                            err,
                            fatal: true,
                        });
                    }

                    done++;
                    mutecount++;
                    continue;
                } else {
                    //Member got banned
                    await new Infractions().moveFromOpenToClosed(results[i]);
                    await bot.guilds.cache
                        .get(results[i].guild_id)
                        .members.unban(`${results[i].user_id}`, `Auto`)
                        .then(async () => {
                            await setNewModLogMessage(
                                bot,
                                config.defaultModTypes.unban,
                                bot.user.id,
                                results[i].user_id,
                                'Auto',
                                null,
                                results[i].guild_id
                            );

                            await privateModResponse(
                                bot.users.cache.get(results[i].user_id),
                                config.defaultModTypes.unmute,
                                'Auto',
                                null,
                                bot,
                                guild.name
                            );
                        })
                        .catch((err) => {});

                    done++;
                    bancount++;
                }
            }
        }
        console.info(
            `Check Infraction done. ${done} infractions removed! (${mutecount} Mutes & ${bancount} Bans)`,
            new Date().toLocaleString('de-DE', {
                timeZone: 'Europe/Berlin',
            })
        );
    }, interval);
};
