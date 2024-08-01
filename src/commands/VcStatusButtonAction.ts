import {
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ComponentType,
} from 'discord.js';
import { MessageComponentActionInteraction } from './base/action_base.js';
import vcStatusModalAction from './VcStatusModalAction.js';

class VcStatusButtonAction extends MessageComponentActionInteraction<ComponentType.Button> {
  /**
   * ボタンを作成します
   * @returns 作成したビルダー
   */
  override create(): ButtonBuilder {
    // カスタムIDを生成
    const customId = this.createCustomId({});

    // ダイアログを作成
    return new ButtonBuilder()
      .setCustomId(customId)
      .setLabel('チャンネルステータスを変更')
      .setStyle(ButtonStyle.Success)
      .setEmoji('✏');
  }

  /** @inheritdoc */
  override async onCommand(
    interaction: ButtonInteraction,
    _params: URLSearchParams,
  ): Promise<void> {
    // チャンネルステータス入力モーダルを表示
    await interaction.showModal(vcStatusModalAction.create());
  }
}

export default new VcStatusButtonAction('vcstatus', ComponentType.Button);
