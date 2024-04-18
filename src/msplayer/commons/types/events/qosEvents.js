function Type(type, message) {
  this.type = type
  this.message = message
}

Type.prototype.toString = function() {
  return this.message
}

export default {
  ABANDON_RESET: 'abandon_reset',
  ABANDON_UNLOAD: 'abandon_unload',

  ADS_FIRST_AD_JOIN: 'ads_first_ad_join',
  ADS_IMA_INIT: 'ads_ima_init',
  ADS_IMA_INIT_ADS_LOADER: 'ads_ima_init_ads_loader',
  ADS_IMA_REQUEST_ADS: 'ads_ima_request_ads',
  ADS_IMA_START_ADS: 'ads_ima_start_ads',
  ADS_IMA_WAIT_SDK: 'ads_ima_wait_sdk',
  ADS_NEXT_AD_JOIN: 'ads_next_ad_join',
  ADS_SLOT_DURATION: 'ads_slot_duration',
  ADS_SLOT_SUMMARY: 'ads_slot_summary',

  ERROR: 'error',
  ERROR_CONTENT_GEOBLOCKED: 'error_content_geoblocked',
  ERROR_FATAL: 'error_fatal',
  ERROR_STREAM_FALLBACK: 'error_services_fallback',

  PLAYBACK_JOIN: 'playback_join',

  PLAYER_START: 'player_start',

  SERVICES_INIT_ADS: 'services_init_ads',
  SERVICES_INIT_ANALYTICS: 'services_init_analytics',
  SERVICES_INIT_CONFIG: 'services_init_config',
  SERVICES_INIT_DELIVERY: 'services_init_delivery',
  SERVICES_INIT_GATEKEEPER: 'services_init_gatekeeper',
  SERVICES_INIT_GEOBLOCKING: 'services_init_geoblocking',
  SERVICES_INIT_RELATED: 'services_init_related',
  SERVICES_INIT_SHARE: 'services_init_share',
  SERVICES_INIT_VIDEO_THUMBNAILS: 'services_init_video_thumbnails',

  STARTER_SRC_PLAYBACK: 'starter_src_playback'
}
