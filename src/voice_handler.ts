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

/** 画面共有催促の状態 */
const screenShareStatus: Record<string, Job> = {};

/**
 * VCの人数が変わったら処理を行う
 * @param channel VCの人数が変わったチャンネル
 * @param isUpdated チャンネルステータスが更新されたかどうか
 */
function updateVoiceChannel(
  channel: VoiceBasedChannel,
  isUpdated = false,
): void {
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

  // ステータスメッセージ催促処理
  if (channel.members.size >= config.status_message.num_user_to_describe) {
    // Jobがなければ
    if (!vcStatus[channel.id]) {
      // すでにステータスメッセージが設定されているか確認
      const status = getVoiceStatus(channel);

      if (status) {
        // ステータスメッセージが設定されている場合、MINUTE_TO_MODIFY_STATUS後に更新するように促す
        const job = scheduleJob(
          new Date(
            Date.now() +
              config.status_message.minute_to_modify_status * 60 * 1000,
          ),
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
          new Date(
            Date.now() + config.status_message.minute_to_set_status * 60 * 1000,
          ),
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

  // 画面共有催促処理
  updateScreenSharePrompt(channel);
}

/**
 * 画面共有催促の処理を行う
 * @param channel VCチャンネル
 */
function updateScreenSharePrompt(channel: VoiceBasedChannel): void {
  // 対象のカテゴリにいるか確認
  if (!channel.parentId || !config.vc_category_ids.includes(channel.parentId)) {
    return;
  }
  // 除外対象のチャンネルか確認
  if (config.exclude_vc_channel_ids.includes(channel.id)) {
    return;
  }

  // 必要人数以上いて、かつ画面共有人数が閾値未満の場合
  if (
    channel.members.size >= config.screen_share.min_users_for_prompt &&
    channel.members.filter((member) => member.voice.streaming).size <
      config.screen_share.min_screen_share_users
  ) {
    // Jobがなければ
    if (!screenShareStatus[channel.id]) {
      // 初回の催促をスケジュール
      const job = scheduleJob(
        new Date(Date.now() + config.screen_share.minute_to_prompt * 60 * 1000),
        async () => {
          await channel.send({
            content: `画面共有をして、自分のゲームや作業をみんなに見せてみよう！\n-# VC外からも画面共有のプレビューが見れます。VCに来てくれる人が増えるかも？`,
            allowedMentions: { users: [] },
          });
        },
      );
      // Jobを保存
      screenShareStatus[channel.id] = job;
    }
  } else {
    // 条件を満たさない場合はジョブを削除
    const job = screenShareStatus[channel.id];
    if (job) {
      job.cancel();
      delete screenShareStatus[channel.id];
    }
  }
}

/**
 * 入退室時のイベントハンドラー
 * @param oldState 前の状態
 * @param newState 新しい状態
 */
export function onVoiceStateUpdate(
  oldState: VoiceState,
  newState: VoiceState,
): void {
  try {
    const oldChannel = oldState.channel;
    const newChannel = newState.channel;

    if (oldChannel === newChannel) {
      // 画面共有状態の変更を検出
      const streamingChanged = oldState.streaming !== newState.streaming;

      // 同じチャンネル内での状態変更（画面共有のON/OFF等）
      if (streamingChanged && newChannel) {
        updateScreenSharePrompt(newChannel);
      }
      return;
    }

    if (newChannel) {
      // ユーザーがボイスチャンネルに参加たとき
      updateVoiceChannel(newChannel);
    }

    if (oldChannel) {
      // ユーザーがボイスチャンネルから退出したとき
      updateVoiceChannel(oldChannel);
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
      updateVoiceChannel(channel, true);
    }
  } catch (error) {
    logger.error('onVoiceStatusUpdate中にエラーが発生しました。', error);
  }
}
