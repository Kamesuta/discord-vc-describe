import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  RepliableInteraction,
  SlashCommandSubcommandBuilder,
} from 'discord.js';
import { SubcommandInteraction } from './base/command_base.js';
import vcCommand from './VcCommand.js';
import { setVoiceStatus } from '../voice_status_handler.js';
import { onVoiceStatusUpdate } from '../voice_handler.js';

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
    if (!member) {
      await interaction.reply({
        ephemeral: true,
        content: 'メンバー情報が取得できませんでした',
      });
      return;
    }

    // コマンドを打っているチャンネルを取得
    const commandChannel = interaction.channel;
    if (!commandChannel?.isVoiceBased()) {
      await interaction.reply({
        ephemeral: true,
        content: 'VCチャンネルでコマンドを実行してください',
      });
      return;
    }

    // 入っているVCチャンネルを取得
    const vcChannel = member.voice.channel;

    // 管理者(チャンネル管理)は無条件で許可
    if (!member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      // 入っているVCチャンネルをチェック
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
      if (
        !member
          .permissionsIn(vcChannel)
          .has(1n << 48n /* SetVoiceChannelStatus */)
      ) {
        await interaction.reply({
          ephemeral: true,
          content: 'チャンネルステータスを設定する権限がありません',
        });
        return;
      }
    }

    // メッセージを設定
    await setVoiceStatus(commandChannel, message);

    // メッセージを送信
    await interaction.reply({
      ephemeral: commandChannel.id !== vcChannel?.id,
      content: `<@${interaction.user.id}> がチャンネルステータスを「${message}」に設定しました`,
      allowedMentions: { users: [] },
    });

    // イベントを呼び出し
    await onVoiceStatusUpdate(commandChannel.id, message);
  }
}

export default new VcStatusCommand(vcCommand);
