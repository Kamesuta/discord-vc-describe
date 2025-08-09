import {
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ComponentType,
  ContainerBuilder,
  TextDisplayBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags,
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
    // Message Component V2を使用してコンテナを作成
    const helpContainer = new ContainerBuilder()
      .setAccentColor(0x5865f2)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('# 📺 画面共有のやり方'),
      )
      .addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems(
          new MediaGalleryItemBuilder()
            .setURL(config.screen_share.help_image_url)
            .setDescription('画面共有の手順'),
        ),
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          '**PC版Discord:**\n' +
            '1. VCに参加\n' +
            '2. 左下の「📺画面を共有」をクリック\n' +
            '3. 共有したいゲームや画面を選択すればOK！\n\n' +
            '**スマホ版Discord:**\n' +
            '1. VCに参加\n' +
            '2. つまみを上にスワイプ (わかりにくいので注意)\n' +
            '3. 「画面を共有する」を選択\n' +
            '4. 共有するアプリを選択すればOK！',
        ),
      );

    // Message Component V2でephemeralレスポンス
    await interaction.reply({
      components: [helpContainer],
      flags: MessageFlags.IsComponentsV2,
      ephemeral: true,
    });
  }
}

export default new ScreenShareHelpButtonAction(
  'screensharehelp',
  ComponentType.Button,
);
