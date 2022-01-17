const config = require('../../config.json');
const { insertDataToClosedInfraction } = require('../../utils/functions/insertDataToDatabase');
const { setNewModLogMessage } = require('../../utils/modlog/modlog');
const { privateModResponse } = require('../../utils/privatResponses/privateModResponses');
const {
    Database
} = require('../db/db');
const { log } = require('../../logs');
const { giveAllRoles } = require('../../utils/functions/roles/giveAllRoles');

const database = new Database;

async function deleteEntries(infraction) {
    try {
        insertDataToClosedInfraction(infraction.user_id, infraction.mod_id, infraction.mute, infraction.ban, 0, 0, infraction.till_date, infraction.reason, infraction.infraction_id);
        database.query('DELETE FROM open_infractions WHERE infraction_id = ?', [infraction.infraction_id]).catch(err => console.log(err));
    }catch(err) {
        log.fatal(err);
        if(config.debug == 'true') console.log(err);
    }
}

function checkInfractions(bot) {
    setInterval(() => {
        database.query(`SELECT * FROM open_infractions`).then(async results => {
            let done = 0;
            let mutecount = 0;
            let bancount = 0;
            for(let i in results) {
                if(results[i].till_date == null) continue;

                //Member can be unmuted
                let currentdate = new Date().toLocaleString('de-DE', {            
                    timeZone: 'Europe/Berlin',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
                currentdate = currentdate.replace(',', '').replace(':', '').replace(' ', '').replace(':', '').replace('.', '').replace('.', '').replace('.', '');
                results[i].till_date = results[i].till_date.replace(',', '').replace(':', '').replace(' ', '').replace(':', '').replace('.', '').replace('.', '').replace('.', '');

                if ((currentdate - results[i].till_date) > 0 && currentdate[6] + currentdate[7] >= results[i].till_date[7] + results[i].till_date[7]) {
                    if(results[i].mute) {
                        try {
                            try {
                                var guild = await bot.guilds.cache.get(results[i].guild_id);
                                var user = await guild.members.fetch(results[i].user_id).then(members => members);
                            }catch(err) {
                                //Member left or got kicked
                                deleteEntries(results[i]);
                                continue;
                            }
                            
                            try {
                                await giveAllRoles(results[i].user_id, results[i].guild_id , JSON.parse(results[i].user_roles))
                                setNewModLogMessage(bot, config.defaultModTypes.unmute, bot.user.id, user.id, 'Auto', null, results[i].guild_id);
                                privateModResponse(user, config.defaultModTypes.unmute, 'Auto');
                                await deleteEntries(results[i]);
                                done++;
                                mutecount++;
                            }catch(err) {
                                log.fatal(err);
                                if(config.debug == 'true') console.log(err);
                            }
                        }catch(err) {
                            log.fatal(err);
                            if(config.debug == 'true') console.log(err);
                        }
                    }else { //Member got banned
                        done++;
                        bancount++;
                        try {
                            await bot.guilds.cache.get(results[i].guild_id).members.unban(`${results[i].user_id}`, `Auto`)
                            setNewModLogMessage(bot, config.defaultModTypes.unban, bot.user.id, results[i].user_id, 'Auto', null, results[i].guild_id);
                            deleteEntries(results[i]);
                        }catch(err) {
                            //Unknown ban
                            deleteEntries(results[i]);
                        }
                    }
                }
            }
            console.log(`Check Infraction done. ${done} infractions removed! (${mutecount} Mutes & ${bancount} Bans)`, new Date().toLocaleString('de-DE', {timeZone: 'Europe/Berlin'}))
        }).catch(err => {
            log.fatal(err);
            if(config.debug == 'true') console.log(err);
        });
    }, config.defaultCheckInfractionTimer);
}

module.exports = {checkInfractions}