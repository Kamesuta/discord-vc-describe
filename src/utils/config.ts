import assert from 'assert';
import { parse } from 'toml';
import { getWorkdirPath } from './workdir.js';
import { copyFileSync, existsSync, readFileSync } from 'fs';

/**
 * Structure of the configuration file
 */
export interface Config {
  /*
   * Configuration names should be written in snake_case. Therefore, we are disabling eslint naming rules here.
   * The 'requiresQuotes' rule is disabled here because it only excludes strings (including those with spaces) that need to be enclosed in quotes.
   */
  /* eslint-disable @typescript-eslint/naming-convention */

  /** サーバーID */
  guild_ids: string[];

  /** 催促対象のVCカテゴリID */
  vc_category_ids: string[];

  /** 催促から除外するVCチャンネルID */
  exclude_vc_channel_ids: string[];

  /** ステータスメッセージをつけるべき人数 */
  num_user_to_describe: number;

  /** ステータスメッセージを設定するべき時間 (分) */
  minute_to_set_status: number;

  /** ステータスメッセージを変更するべき時間 (分) */
  minute_to_modify_status: number;

  /* eslint-enable @typescript-eslint/naming-convention */
}

// If config.toml does not exist, copy config.default.toml
if (!existsSync(getWorkdirPath('config.toml'))) {
  copyFileSync(
    getWorkdirPath('config.default.toml'),
    getWorkdirPath('config.toml'),
  );
}

/** Configuration */
export const config: Config = parse(
  readFileSync(getWorkdirPath('config.toml'), 'utf-8'),
) as Config;

assert(
  config.guild_ids && Array.isArray(config.guild_ids),
  'guild_ids is required.',
);
