import typeBuilder from '../helper'

export default typeBuilder([
  'SERVICE_INIT_STARTED',
  'SERVICE_INIT_ENDED',
  'SERVICE_INIT_ERROR',

  'PLAYER_START_REQUESTED',
  'PLAYER_ERROR',
  'PLAYER_ERROR_CONTENT_GEOBLOCKED',
  'PLAYER_ERROR_FATAL',
  'PLAYER_ERROR_PLAY',
  'PLAYER_ERROR_STREAM_FALLBACK',
  'PLAYER_RESET',
  'PLAYER_TOGGLE_FULL_SCREEN_BT_CLICK',

  'SHARE',

  'STARTER_SRC_PLAYBACK_STARTED',
  'STARTER_SRC_PLAYBACK_ENDED',
  'ERROR_STARTER_SRC_PLAYBACK'
])
