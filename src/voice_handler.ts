import {
  ActionRowBuilder,
  ButtonBuilder,
  VoiceBasedChannel,
  VoiceState,
} from 'discord.js';
import { logger } from './utils/log.js';
import vcStatusButtonAction from './commands/VcStatusButtonAction.js';
import { Job, scheduleJob } from 'node-schedule';
import { getVoiceStatus } from './voice_status_handler.js';
import { client } from './index.js';
import { config } from './utils/config.js';

/** VCの状態 */
const vcStatus: Record<string, Job> = {};

/**
 * VCの人数が変わったら処理を行う
 * @param channel VCの人数が変わったチャンネル
 * @param isUpdated チャンネルステータスが更新されたかどうか
 */
// eslint-disable-next-line @typescript-eslint/require-await
async function updateVoiceChannel(
  channel: VoiceBasedChannel,
  isUpdated = false,
): Promise<void> {
  // チャンネルステータスが更新された場合は一旦ジョブを削除
  if (isUpdated) {
    const job = vcStatus[channel.id];
    if (job) {
      job.cancel();
      delete vcStatus[channel.id];
    }
  }

  // 対象のカテゴリにいるか確認
  if (!channel.parentId || !config.vc_category_ids.includes(channel.parentId)) {
    return;
  }
  // 除外対象のチャンネルか確認
  if (config.exclude_vc_channel_ids.includes(channel.id)) {
    return;
  }

  // NUM_USER_TO_DESCRIBE人以上の場合はステータスメッセージを更新するように促す
  if (channel.members.size >= config.num_user_to_describe) {
    // Jobがなければ
    if (!vcStatus[channel.id]) {
      // すでにステータスメッセージが設定されているか確認
      const status = getVoiceStatus(channel);

      if (status) {
        // ステータスメッセージが設定されている場合、MINUTE_TO_MODIFY_STATUS後に更新するように促す
        const job = scheduleJob(
          new Date(Date.now() + config.minute_to_modify_status * 60 * 1000),
          async () => {
            await channel.send({
              content: `まだ「${status}」についてお話中かな？\nもし違う話題にうつっていたらステータスメッセージを変更してみよう！`,
              components: [
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                  vcStatusButtonAction.create(),
                ),
              ],
              allowedMentions: { users: [] },
            });
          },
        );
        // Jobを保存
        vcStatus[channel.id] = job;
      } else {
        // ステータスメッセージが設定されていない場合、MINUTE_TO_SET_STATUS後に設定するように促す
        const job = scheduleJob(
          new Date(Date.now() + config.minute_to_set_status * 60 * 1000),
          async () => {
            await channel.send({
              content: `今何してる？\nステータスメッセージを設定してみよう！`,
              components: [
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                  vcStatusButtonAction.create(),
                ),
              ],
              allowedMentions: { users: [] },
            });
          },
        );
        // Jobを保存
        vcStatus[channel.id] = job;
      }
    }
  } else {
    // ジョブを削除
    const job = vcStatus[channel.id];
    if (job) {
      job.cancel();
      delete vcStatus[channel.id];
    }
  }
}

/**
 * 入退室時のイベントハンドラー
 * @param oldState 前の状態
 * @param newState 新しい状態
 */
export async function onVoiceStateUpdate(
  oldState: VoiceState,
  newState: VoiceState,
): Promise<void> {
  try {
    const oldChannel = oldState.channel;
    const newChannel = newState.channel;
    if (oldChannel === newChannel) return;

    if (newChannel) {
      // ユーザーがボイスチャンネルに参加たとき
      await updateVoiceChannel(newChannel);
    }

    if (oldChannel) {
      // ユーザーがボイスチャンネルから退出したとき
      await updateVoiceChannel(oldChannel);
    }
  } catch (error) {
    logger.error('onVoiceStateUpdate中にエラーが発生しました。', error);
  }
}

/**
 * チャンネルのステータスが変更されたときのイベントハンドラー
 * @param channelId チャンネルID
 * @param _status ステータス
 */
export async function onVoiceStatusUpdate(
  channelId: string,
  _status: string | null,
): Promise<void> {
  try {
    const channel = await client.channels.fetch(channelId);
    if (channel?.isVoiceBased()) {
      await updateVoiceChannel(channel, true);
    }
  } catch (error) {
    logger.error('onVoiceStatusUpdate中にエラーが発生しました。', error);
  }
}
