import {
  isImmutable, List, Map, Record
} from 'immutable'
import {
  playerTypes,
  preloadingLevels,
  preloadingTypes,
  scaleFits,
  serviceNames,
  stages
} from '../../../commons/types'

export const STARTER_SRC_URL = 'https://baul.mediaset.es/player/mini.mp4'

export const singleServiceModel = new Record({
  url: undefined,
  response: undefined
})

export const servicesModel = new Record({
  [serviceNames.ADS]: new singleServiceModel(),
  [serviceNames.ANALYTICS]: new singleServiceModel(),
  [serviceNames.CONFIG]: new singleServiceModel(),
  [serviceNames.DELIVERY]: new singleServiceModel(),
  [serviceNames.GATEKEEPER]: new singleServiceModel(),
  [serviceNames.GBX]: new singleServiceModel(),
  [serviceNames.GEOBLOCKING]: new singleServiceModel(),
  [serviceNames.GEOLOCATION]: new singleServiceModel(),
  [serviceNames.MULTICHANNEL]: new singleServiceModel(),
  [serviceNames.NEXT]: new singleServiceModel(),
  [serviceNames.PROGRAM]: new singleServiceModel(),
  [serviceNames.RELATED_VIDEOS]: new singleServiceModel(),
  [serviceNames.SHARE]: new singleServiceModel(),
  [serviceNames.SRC]: new singleServiceModel(),
  [serviceNames.VIDEO_THUMBNAILS]: new singleServiceModel(),
  [serviceNames.XDR]: new singleServiceModel()
})

export const errorModel = new Record({
  code: undefined,
  description: undefined,
  target: undefined,
  type: undefined
})

export const playerModel = new Record({
  actualTrackSubtitleIndex: 0,
  adPodIndex: 1,
  adsShapeInfo: undefined,
  adShapeStyle: undefined,
  adShapeStyleVideo: undefined,
  allAdsCompleted: undefined,
  ampVars: undefined,
  audioTracks: new List(),
  autoplayDelay: 5000,
  bbx: undefined,
  bluekai: new (Record({
    isEnabled: false,
    siteCode: undefined
  }))(),
  buffered: undefined,
  canPlayThrough: false,
  canPlayTimeout: 2000,
  carouselType: undefined,
  cerberoCookie: undefined,
  jekyllCookie: undefined,
  chatComponent: undefined,
  channel: undefined,
  channelError: undefined,
  cmsId: undefined,
  concurrency: new (Record({
    endpoint: undefined,
    interval: undefined,
    isEnabled: false,
    session: undefined,
    timestamp: undefined
  }))(),
  configChatButton: new (Record({
    enabled: undefined,
    literal: undefined,
    state: undefined
  }))(),
  contentTitle: '',
  contentUrl: undefined,
  conviva: new (Record({
    allowUncaughtExceptions: false,
    customerKey: undefined,
    defaultResource: undefined,
    gatewayUrl: undefined,
    isEnabled: false,
    isEnabledAds: false,
    logLevel: 'none'
  }))(),
  csai: new (Record({
    duration: undefined,
    isEnabled: true,
    isProcessing: false,
    previousVolume: undefined
  }))(),
  currentAudioTrack: new (Record({
    index: 0,
    label: undefined,
    language: undefined
  }))(),
  currentBitrate: undefined,
  currentFps: undefined,
  currentLocationIndex: 0,
  currentTime: 0,
  currentVideoId: undefined,
  customAnalytics: new (Record({
    bluekai: new (Record({
      msId: undefined
    }))(),
    omniture: new (Record({
      heartbeats: new (Record({
        config: undefined,
        media: undefined,
        videoCustomMetadata: undefined
      }))(),
      multiProfile: undefined
    }))()
  }))(),
  customServices: new (Record({
    [serviceNames.ADS]: undefined,
    [serviceNames.ANALYTICS]: undefined,
    [serviceNames.CARONTE]: undefined,
    [serviceNames.CERBERO]: undefined,
    [serviceNames.CONFIG]: undefined,
    [serviceNames.DELIVERY]: undefined,
    [serviceNames.GATEKEEPER]: undefined,
    [serviceNames.GBX]: undefined,
    [serviceNames.GEOLOCATION]: undefined,
    [serviceNames.NEXT]: undefined,
    [serviceNames.PROGRAM]: undefined,
    [serviceNames.RELATED_VIDEOS]: undefined,
    [serviceNames.SHARE]: undefined,
    [serviceNames.VIDEO_THUMBNAILS]: undefined,
    [serviceNames.XDR]: undefined
  }))(),
  debug: new (Record({
    isEnabled: false,
    uids: new List()
  }))(),
  description: undefined,
  dfp: new (Record({
    adTagUrl: undefined,
    custParams: new Map(),
    descriptionUrl: undefined,
    disableCustomPlaybackForIOS10Plus: true,
    enablePreloading: false,
    isCustomAdBreakEnabled: false,
    isLongForm: undefined,
    iu: undefined,
    useStyledNonLinearAds: true
  }))(),
  downloadUrl: undefined,
  droppedFrames: 0,
  duration: -1,
  editorialId: undefined,
  episodeName: undefined,
  mediaName: undefined,
  error: undefined,
  exitPlaybackBt: new (Record({
    isEnabled: false,
    position: undefined,
    type: undefined
  }))(),
  fingerprint: new (Record({
    duration: 25,
    interval: 720,
    isEnabled: undefined
  }))(),
  gad: undefined,
  gbx: undefined,
  genre: undefined,
  hasFocus: false,
  id: 'default_id',
  isAmp: false,
  isAdsConsented: undefined,
  isAdsEnabled: true,
  isAdsStartFailed: false,
  isAlreadyClickMessage: false,
  isAutoHideControlBarEnabled: true,
  isAutoplay: false,
  isAutoplayWithDelayEnabled: false,
  isBluekaiConsented: undefined,
  isButtonVisible: true,
  isContentEnded: false,
  isContentPreloaded: false,
  isContentRecoveryNeeded: false,
  isContentStarted: false,
  isControlBarEnabled: true,
  isControlBarVisible: false,
  isCursorVisible: true,
  isDaiAdPaused: false,
  isDialogAudioSubtitlesMobileVisible: false,
  isDialogRelatedVisible: false,
  isDialogShareVisible: false,
  isExitFullWindowEnabled: true,
  isFirstFramePlayed: false,
  isFullScreen: false,
  isFullScreenDelegated: false,
  isFullScreenEnabled: undefined,
  isFullWindow: false,
  isHeaderBiddingEnabled: true,
  isHeartbeatsEnabled: false,
  isIncognito: false,
  isKeyboardControlEnabled: true,
  isLive: undefined,
  isLoopEnabled: false,
  isDialogAudioSubtitlesDesktopVisible: false,
  isMoatConsented: undefined,
  isMultichannelEnabled: undefined,
  isMuted: false,
  isNextVideo: false,
  isNextVideoPlayback: false,
  isNextBottonVisible: false,
  isOmnitureConsented: undefined,
  isPausedByUser: false,
  isPlaybackAllowed: true,
  isPlayerInitialized: false,
  isPlaying: false,
  isPreloading: false,
  isPreplayerPlayInsetVisible: true,
  isProcessing: false,
  isProcessingChannelChange: false,
  isProcessingChannelChangeRecovery: false,
  isProcessingPreloading: false,
  isProcessingProgramChange: false,
  isProcessingStartOver: false,
  isQosAnalyticsEnabled: true,
  isRecoveryPlay: false,
  isRelatedAutoplayEnabled: false,
  isRelatedEnabled: false,
  isScrubbing: false,
  isSeeking: false,
  isSeekInsetEnabled: true,
  isServicesPreloaded: false,
  isShareEnabled: false,
  isStandByPlaying: false,
  isStartOverAvailable: false,
  isStartOverEnabled: false,
  isStartOverPlayback: false,
  isStartPlayerRequested: false,
  isVideoGallery: false,
  isVideoPlaying: false,
  kibana: new (Record({
    isEnabled: false,
    path: undefined
  }))(),
  liveEventId: undefined,
  locale: undefined,
  locations: new List(),
  mediaEventsHistory: new List(),
  mediaId: undefined,
  mediaPlayerDash: undefined,
  midrollIndex: 0,
  moat: new (Record({
    isEnabled: false,
    partnerCode: undefined // e.g. 'publiespima861787547452'
  }))(),
  mode: undefined,
  mouseX: undefined,
  mouseY: undefined,
  multichannelLastConfig: undefined,
  multichannelPlayedTime: 0,
  multichannelZaps: 0,
  mustPlayFullScreen: false,
  mustPlayFullWindow: false,
  mustStartFullScreen: false,
  next: new (Record({
    literal: undefined,
    isEnabled: undefined
  }))(),
  // Deprecated cuando se migre a Heartbeats
  omniture: new (Record({
    vars: new Map()
  }))(),
  permutive: new (Record({
    isEnabled: true,
    jekyll: undefined
  }))(),
  playStartTimestamp: undefined,
  playedTime: 0,
  playerSize: new (Record({
    width: 640,
    height: 360
  }))(),
  platform: undefined,
  positionNextPrev: undefined,
  poster: undefined,
  posterBackup: 'https://album.mediaset.es/atenea/backup_poster_e49ec340bd.png',
  posterImagizerType: undefined,
  preloading: new (Record({
    isEnabled: false,
    level: preloadingLevels.NONE,
    limit: -1,
    type: preloadingTypes.LAZY
  }))(),
  previousVideoTitle: null,
  processButtonVisible: false,
  nextVideoTitle: null,
  processingMessage: undefined,
  rating: '',
  recoveryAttempts: 0,
  recoveryRemainingTime: 1000, // max = 2147483647,
  scrubbingPosition: 0,
  seekTarget: undefined,
  services: new servicesModel(),
  servicesPing: new (Record({
    interval: 300,
    isEnabled: false,
    url: undefined
  }))(),
  sessionId: undefined,
  siteCreated: undefined,
  sitePublished: undefined,
  soundWaveUrl: undefined,
  sparrow: new (Record({
    datetime: undefined,
    duration: 3000,
    eventName: 'sparrow-message',
    ids: undefined,
    isEnabled: false,
    isEnabledLive: true,
    isEnabledVod: false,
    isFilterEnabled: undefined,
    namespace: undefined,
    position: 'TR',
    reveal: undefined,
    room: undefined,
    targetRoom: undefined
  }))(),
  show: undefined,
  src: undefined,
  srcBeforeAds: undefined,
  stage: stages.PRE_PLAYER,
  startPlayerAttr: undefined,
  startPosition: 0,
  startPositionPreloaded: 0,
  startSrc: undefined,
  subtitle: undefined,
  subtitles: new (Record({
    config: undefined,
    currentSubtitles: undefined,
    isAvailable: false,
    isEnabled: true,
    selected: {
      language: 'none',
      name: 'Ninguno'
    }
  }))(),
  theme: undefined,
  totalVideogallery: undefined,
  title: undefined,
  type: playerTypes.VIDEO_PLAYER,
  user: new (Record({
    firstName: undefined,
    gender: undefined,
    isSubscribed: undefined,
    lastName: undefined,
    photoURL: undefined,
    signatureTimestamp: undefined,
    thumbnailURL: undefined,
    UID: undefined,
    UIDSignature: undefined,
    profile: {
      pid: undefined,
      name: undefined,
      channels: {
        id: undefined,
        color: undefined
      },
      images: {
        id: undefined,
        src: undefined
      }
    }
  }))(),
  version: undefined,
  videoScaleFit: scaleFits.CONTAIN,
  volume: 1,
  watermarks: undefined,
  withCredentials: true,
  npaw: new (Record({
    accountId: undefined,
    active: false,
    hls: '',
    html5: '',
    dash: '',
    shaka: '',
    ima: ''
  }))()
})

export function createInitialState(attributes) {
  const setAttributes = function (attr, state, indent = '  ') {
    if (state && state.has) {
      for (const key in attr) {
        const value = attr[key]

        // console.log(`${indent}${key}: ${JSON.stringify(value)}`)

        if (value !== undefined) {
          if (state.has(key) || Map.isMap(state)) {
            if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || Array.isArray(value) || value === null) {
              try {
                state = state.set(key, value)
              } catch (e) {
                console.error(e)
              }
            } else if (typeof value === 'object') {
              if (isImmutable(state.get(key))) {
                state = state.set(key, setAttributes(value, state.get(key), `${indent}  `))
              } else {
                try {
                  state = state.set(key, value)
                } catch (e) {
                  console.error(e)
                }
              }
            }
          }
        }
      }
    }
    return state
  }

  const state = setAttributes(attributes, new playerModel()).setIn(['services', serviceNames.CONFIG, 'url'], attributes.configUrl)

  return state.toJS()
}
