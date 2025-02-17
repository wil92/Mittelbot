/**
 *
 * @param {JSON} user
 * @param {JSON} guild
 * @param {Array} roles
 */

const { errorhandler } = require('../errorhandler/errorhandler');

async function giveAllRoles(userId, guild, roles) {
    if (roles.length !== 0) {
        for (let x in roles) {
            try {
                const role = await guild.roles.cache.find((role) => role.id == roles[x]);
                const member = await guild.members.cache.get(userId);

                if (!role) {
                    return;
                }
                member.roles
                    .add([role])
                    .then(() => {
                        errorhandler({
                            fatal: false,
                            message: `${userId} was given the roles back in ${guild.id}. ROLEID: ${roles[x]}`,
                        });
                    })
                    .catch((err) => {});
            } catch (err) {
                return errorhandler({ err, fatal: true });
            }
        }
    }
}

module.exports = { giveAllRoles };
