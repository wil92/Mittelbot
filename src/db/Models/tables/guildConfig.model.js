const { Model, DataTypes } = require('sequelize');
const database = require('../../db');

class GuildConfig extends Model {}

GuildConfig.init(
    {
        guild_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            unique: 'guild_id',
        },
        welcome_channel: {
            type: DataTypes.JSON,
            defaultValue: {},
        },
        apply_form: {
            type: DataTypes.JSON,
            defaultValue: {},
        },
        start: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        levelup_channel: {
            type: DataTypes.BIGINT,
        },
        levelsettings: {
            type: DataTypes.JSON,
            defaultValue: { mode: 'normal', levelup_channel: 'disable', blacklistchannels: [] },
        },
        joinroles: {
            type: DataTypes.JSON,
            defaultValue: [],
        },
        modroles: {
            type: DataTypes.JSON,
            defaultValue: [],
        },
        prefix: {
            type: DataTypes.STRING,
            defaultValue: '!',
        },
        cooldown: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        translate: {
            type: DataTypes.JSON,
            defaultValue: {
                mode: 'disable',
                translate_log_channel: '',
                translate_language: 'en',
                translate_target: '',
            },
        },
        disabled_modules: {
            type: DataTypes.JSON,
            defaultValue: [],
        },
        deleteModeCommandAfterUsage: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        deleteCommandAfterUsage: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        logs: {
            type: DataTypes.JSON,
            defaultValue: {
                events: [
                    'guildMemberNicknameUpdate',
                    'guildMemberOffline',
                    'guildMemberOnline',
                    'guildMemberRoleAdd',
                    'guildMemberRoleRemove',
                    'userAvatarUpdate',
                    'userUsernameUpdate',
                ],
            },
        },
        warnroles: {
            type: DataTypes.JSON,
            defaultValue: [],
        },
        disabled_commands: {
            type: DataTypes.JSON,
            defaultValue: [],
        },
    },
    {
        sequelize: database,
        tableName: 'guild_config',
        timestamps: false,
    }
);

const guildConfig = GuildConfig;
module.exports = guildConfig;
