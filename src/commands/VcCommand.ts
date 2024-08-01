import { SlashCommandBuilder } from 'discord.js';
import { CommandGroupInteraction } from './base/command_base.js';

class VcCommand extends CommandGroupInteraction {
  command = new SlashCommandBuilder()
    .setName('vc')
    .setDescription('VC関連のコマンドを実行します');
}

export default new VcCommand();
