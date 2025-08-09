import {
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ComponentType,
} from 'discord.js';
import { MessageComponentActionInteraction } from './base/action_base.js';
import { config } from '../utils/config.js';

class ScreenShareHelpButtonAction extends MessageComponentActionInteraction<ComponentType.Button> {
  /**
   * ボタンを作成します
   * @returns 作成したビルダー
   */
  override create(): ButtonBuilder {
    // カスタムIDを生成
    const customId = this.createCustomId({});

    // ボタンを作成
    return new ButtonBuilder()
      .setCustomId(customId)
      .setLabel('画面共有のやり方を見る')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('📺');
  }

  /** @inheritdoc */
  override async onCommand(
    interaction: ButtonInteraction,
    _params: URLSearchParams,
  ): Promise<void> {
    // 案内メッセージ
    const helpMessage = `# 画面共有のやり方

${config.screen_share.help_image_url}

**PC版Discord:**
1. VCに参加
2. 左下の「📺画面を共有」をクリック
3. 共有したいゲームや画面を選択すればOK！

**スマホ版Discord:**
1. VCに参加
2. つまみを上にスワイプ (わかりにくいので注意)
3. 「画面を共有する」を選択
4. 共有するアプリを選択すればOK！`;

    // ephemeralで返答
    await interaction.reply({
      content: helpMessage,
      ephemeral: true,
    });
  }
}

export default new ScreenShareHelpButtonAction(
  'screensharehelp',
  ComponentType.Button,
);
