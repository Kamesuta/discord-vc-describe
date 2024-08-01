import {
  GatewayDispatchEvents,
  Routes,
  Snowflake,
  VoiceBasedChannel,
} from 'discord.js';
import { client } from './index.js';
import { config } from './utils/config.js';
import { nowait } from './utils/utils.js';

// チャンネルのステータスのレスポンスイベント名
const VOICE_CHANNEL_STATUS_UPDATE =
  'VOICE_CHANNEL_STATUS_UPDATE' as GatewayDispatchEvents;
// チャンネルのステータスを取得するためのリクエストコード
const CHANNEL_STATUS_REQUEST_OP_CODE = 36;
// チャンネルのステータスのレスポンスイベント名
const CHANNEL_STATUSES = 'CHANNEL_STATUSES' as GatewayDispatchEvents;

/**
 * ボイスチャンネルのステータス
 */
let statuses: Record<Snowflake, string | null> = {};

/**
 * ボイスチャンネルのステータス
 */
interface VoiceChannelStatus {
  /** チャンネルのID */
  id: Snowflake;
  /** ステータスのID */
  status: string | null;
  // guild_id: Snowflake;
}

/**
 * すべてのボイスチャンネルのステータス
 */
interface ChannelStatuses {
  /** チャンネルのステータス */
  channels: VoiceChannelStatus[];
  // guild_id: Snowflake;
}

/**
 * ステータス変更時のイベントハンドラーを登録する
 */
export function registerVoiceStatusHandler(): void {
  client.ws.on(VOICE_CHANNEL_STATUS_UPDATE, (data: VoiceChannelStatus) => {
    // ステータスが変更されていなかったら処理を終了
    if (statuses[data.id] === data.status) return;

    // ステータスが変更されたら記録
    statuses[data.id] = data.status;
  });

  // 全チャンネルのステータスを取得するハンドラーを登録
  client.ws.on(CHANNEL_STATUSES, (data: ChannelStatuses) => {
    statuses = Object.fromEntries(data.channels.map((c) => [c.id, c.status]));
  });

  // ボットが起動したとき、全ギルドのVCのステータスを取得する
  client.on(
    'ready',
    nowait(async () => {
      // Gateway APIに対して、サーバーのすべてのVCのステータスを取得するリクエストを送信する
      for (const guildId of config.guild_ids) {
        // サーバーを取得 (取得できない場合は無視)
        const guild = await client.guilds.fetch(guildId).catch((_) => {});
        if (!guild) continue;

        // リクエストを送信
        client.ws['broadcast']({
          op: CHANNEL_STATUS_REQUEST_OP_CODE,
          d: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            guild_id: guildId,
          },
        });
      }
    }),
  );
}

/**
 * ボイスチャンネルのステータスを取得する
 * @param channel チャンネル
 * @returns ステータス
 */
export function getVoiceStatus(channel: VoiceBasedChannel): string | undefined {
  // ステータスの取得
  return statuses[channel.id] ?? undefined;
}

/**
 * ボイスチャンネルのステータスを設定する
 * @param channel チャンネル
 * @param status ステータス
 */
export async function setVoiceStatus(
  channel: VoiceBasedChannel,
  status: string | null,
): Promise<void> {
  // ステータスを更新
  statuses[channel.id] = status;

  // ステータスの更新
  await client.rest.put(`${Routes.channel(channel.id)}/voice-status`, {
    body: {
      status: status,
    },
  });
}
