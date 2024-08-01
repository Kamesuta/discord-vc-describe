import { logger } from './utils/log.js';
import { nowait } from './utils/utils.js';
import { Client, Events, GatewayIntentBits } from 'discord.js';
import CommandHandler from './commands/CommandHandler.js';
import {
  onVoiceChannelStatusUpdate,
  registerVoiceStatusHandler,
} from './voice_status_handler.js';
import { DISCORD_TOKEN } from './env.js';
import commands from './commands/commands.js';
import { onVoiceStateUpdate, onVoiceStatusUpdate } from './voice_handler.js';

/**
 * Discord Client
 */
export const client: Client = new Client({
  // Botで使うGetwayIntents、partials
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

/**
 * Command Handler
 */
const commandHandler = new CommandHandler(commands);

// -----------------------------------------------------------------------------------------------------------
// Register interaction handlers
// -----------------------------------------------------------------------------------------------------------
client.on(
  Events.ClientReady,
  nowait(async () => {
    logger.info(`${client.user?.username ?? 'Unknown'} として起動しました!`);

    // コマンドを登録
    await commandHandler.registerCommands();

    logger.info(`インタラクションの登録が完了しました`);
  }),
);
client.on(
  Events.InteractionCreate,
  nowait(commandHandler.onInteractionCreate.bind(commandHandler)),
);
client.on(Events.VoiceStateUpdate, nowait(onVoiceStateUpdate));
onVoiceChannelStatusUpdate.push(nowait(onVoiceStatusUpdate));

registerVoiceStatusHandler();

// Discordにログインする
await client.login(DISCORD_TOKEN);
