import {
  ActionRowBuilder,
  ButtonBuilder,
  ChatInputCommandInteraction,
  RepliableInteraction,
  SlashCommandSubcommandBuilder,
} from 'discord.js';
import { SubcommandInteraction } from './base/command_base.js';
import vcCommand from './VcCommand.js';
import { setVoiceStatus } from '../voiceStatusHandler.js';
import vcStatusButtonAction from './VcStatusButtonAction.js';

class VcStatusCommand extends SubcommandInteraction {
  command = new SlashCommandSubcommandBuilder()
    .setName('status')
    .setDescription('チャンネルステータスを設定します')
    .addStringOption((option) =>
      option
        .setName('message')
        .setDescription('ステータスメッセージ')
        .setMaxLength(500)
        .setRequired(true),
    );

  override async onCommand(
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    // メッセージを取得
    const message = interaction.options.getString('message');
    if (!message) {
      await interaction.reply({
        ephemeral: true,
        content: 'メッセージが取得できませんでした',
      });
      return;
    }

    await this.editVcStatus(interaction, message);
  }

  /**
   * チャンネルステータスを設定します
   * @param interaction インタラクション
   * @param message メッセージ
   * @returns 処理結果
   */
  async editVcStatus(
    interaction: RepliableInteraction,
    message: string,
  ): Promise<void> {
    // メンバーを取得
    const member = await interaction.guild?.members.fetch(interaction.user.id);

    // コマンドを打っているチャンネルを取得
    const commandChannel = interaction.channel;
    if (!commandChannel) {
      await interaction.reply({
        ephemeral: true,
        content: 'コマンドを打っているチャンネルが取得できませんでした',
      });
      return;
    }
    // 入っているVCチャンネルを取得
    const vcChannel = member?.voice.channel;
    if (!vcChannel) {
      await interaction.reply({
        ephemeral: true,
        content: `<#${commandChannel.id}> に入ってからコマンドを実行してください`,
      });
      return;
    }

    // コマンドを打っているチャンネルがコマンドのVCチャンネルでない場合
    if (commandChannel.id !== vcChannel.id) {
      await interaction.reply({
        ephemeral: true,
        content: `このコマンドは <#${vcChannel.id}> で実行してください`,
      });
      return;
    }

    // 権限をチェック
    if (!member.permissions.has(1n << 48n /* SetVoiceChannelStatus */)) {
      await interaction.reply({
        ephemeral: true,
        content: 'チャンネルステータスを設定する権限がありません',
      });
      return;
    }

    // メッセージを設定
    await setVoiceStatus(vcChannel, message);

    // メッセージを送信
    await interaction.reply({
      content: `チャンネルステータスを「${message}」に設定しました`,
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          vcStatusButtonAction.create(),
        ),
      ],
    });
  }
}

export default new VcStatusCommand(vcCommand);
