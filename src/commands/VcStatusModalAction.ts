import {
  ActionRowBuilder,
  ModalBuilder,
  ModalSubmitInteraction,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { ModalActionInteraction } from './base/action_base.js';
import vcStatusCommand from './VcStatusCommand.js';

class VcStatusModalAction extends ModalActionInteraction {
  /**
   * モーダルを作成
   * @returns 作成したビルダー
   */
  override create(): ModalBuilder {
    // カスタムIDを生成
    const customId = this.createCustomId({});

    // 初期値を設定
    const textInput = new TextInputBuilder()
      .setCustomId('message')
      .setLabel('今何話している？')
      .setMinLength(0)
      .setMaxLength(500)
      .setStyle(TextInputStyle.Short);

    // ダイアログを作成
    return new ModalBuilder()
      .setTitle('チャンネルステータスを入力してください')
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(textInput),
      )
      .setCustomId(customId);
  }

  /** @inheritdoc */
  async onCommand(
    interaction: ModalSubmitInteraction,
    _params: URLSearchParams,
  ): Promise<void> {
    const message = interaction.components[0]?.components[0]?.value;
    if (message === undefined) {
      await interaction.reply({
        ephemeral: true,
        content: 'メッセージが取得できませんでした',
      });
      return;
    }

    // チャンネルステータスを設定
    await vcStatusCommand.editVcStatus(interaction, message);
  }
}

export default new VcStatusModalAction('memo');
