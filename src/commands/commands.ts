import { InteractionBase } from './base/interaction_base.js';
import vcCommand from './VcCommand.js';
import vcStatusCommand from './VcStatusCommand.js';
import vcStatusButtonAction from './VcStatusButtonAction.js';
import vcStatusModalAction from './VcStatusModalAction.js';
import screenShareHelpButtonAction from './ScreenShareHelpButtonAction.js';

const commands: InteractionBase[] = [
  vcCommand,
  vcStatusCommand,
  vcStatusButtonAction,
  vcStatusModalAction,
  screenShareHelpButtonAction,
];

export default commands;
