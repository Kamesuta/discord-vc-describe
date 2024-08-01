import 'dotenv/config';
import assert from 'assert';

assert(process.env.DISCORD_TOKEN, 'DISCORD_TOKEN is not set');
/**
 * The Discord bot token.
 */
export const DISCORD_TOKEN: string = process.env.DISCORD_TOKEN;
