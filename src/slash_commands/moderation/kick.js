const { SlashCommandBuilder } = require('discord.js');
const { kickUser } = require('../../../utils/functions/moderations/kickUser');
const { checkTarget } = require('../../../utils/functions/checkMessage/checkMessage');
const { hasPermission } = require('../../../utils/functions/hasPermissions');
const config = require('../../../src/assets/json/_config/config.json');
const { kickConfig } = require('../_config/moderation/kick');

module.exports.run = async ({ main_interaction, bot }) => {
    await main_interaction.deferReply({
        ephemeral: true,
    });

    const hasPermissions = await hasPermission({
        guild_id: main_interaction.guild.id,
        adminOnly: false,
        modOnly: true,
        user: main_interaction.member,
        bot,
    });

    if (!hasPermissions) {
        return main_interaction
            .followUp({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(
                            global.t.trans(
                                ['error.permissions.user.useCommand'],
                                main_interaction.guild.id
                            )
                        )
                        .setColor(global.t.trans(['general.colors.error'])),
                ],
                ephemeral: true,
            })
            .catch((err) => {});
    }

    const user = main_interaction.options.getUser('user');

    const canIKickTheUser = await checkTarget({
        author: main_interaction.user,
        target: user,
        guild: main_interaction.guild,
        bot,
        type: 'kick',
    });

    if (canIKickTheUser)
        return main_interaction
            .followUp({
                content: canIKickTheUser,
                ephemeral: true,
            })
            .catch((err) => {});

    const reason = main_interaction.options.getString('reason') || 'No reason provided';

    kickUser({ user, mod: main_interaction.user, guild: main_interaction.guild, reason, bot })
        .then((res) => {
            main_interaction
                .followUp({
                    embeds: [res],
                    ephemeral: true,
                })
                .catch((err) => {});
        })
        .catch((err) => {
            main_interaction
                .followUp({
                    content: err,
                    ephemeral: true,
                })
                .catch((err) => {});
        });
    return;
};

module.exports.data = kickConfig;
