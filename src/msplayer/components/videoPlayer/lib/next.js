import { genres, playerModes, serviceNames } from '../../../commons/types'
import { contentEvents } from '../../../commons/types/events'
import { parseProgramChangeError } from '../../../commons/util'

const { CONTENT } = genres
const { NEXT } = serviceNames
const { PLAY_NEXT_VIDEO } = contentEvents
const { PREVIEW } = playerModes

export function handleNextClick(player) {
  return () => {
    player.playNextVideo({ isNextVideoPlayback: true })
  }
}

export function handleClick(player) {
  return (index, playerVars = {}) => {
    player.setState({
      selectedCardIndex: index,
      isPlaying: true,
      isEnabled: true,
      ...playerVars
    }, () => player.handleNextClick())
  }
}

export function isNextBottonVisible(player) {
  return () => {
    const {
      genre, next, services, currentTime, duration, platform,
      isVideoGallery, mode
    } = player.state

    if ((next && next.isEnabled) && genre === CONTENT && mode !== PREVIEW && !isVideoGallery
      && !Number.isNaN(duration) && duration > 0 && services[NEXT].response?.position) {
      let position = platform === 'multisite' ? -10 : services[NEXT].response?.position
      if (position < 0) position = duration + position

      return currentTime >= position
    }
    return !!((next && next.isEnabled) && services[NEXT].response && genre === CONTENT)
  }
}

export function playNextVideo(player) {
  return (attributes = {}) => {
    const {
      isExitFullWindowEnabled,
      mustPlayFullScreen,
      mustPlayFullWindow,
      next,
      onNextVideoChange,
      platform,
      services,
      carouselType,
      selectedCardIndex,
      nextVideoTitle
    } = player.state
    const forceAutoplay = !!(next && next.isEnabled)

    const nextService = platform === 'multisite' || services[NEXT].response.nextVideo
      ? services[NEXT].response.nextVideo
      : services[NEXT].response.videos[0]

    const nextVideoCarousel = selectedCardIndex > 0
      ? services[NEXT].response.videos[selectedCardIndex]
      : nextService

    const nextParseService = platform === 'multisite' || services[NEXT].response.nextVideo
      ? player.parseRelatedAttributesMultisite({ ...services[NEXT].response.nextVideo })
      : player.parseRelatedAttributesMitele({ ...nextVideoCarousel })

    const totalVideosWatched = sessionStorage.getItem('totalVideosWatched')

    if (services[NEXT].response.nextVideo) {
      if (totalVideosWatched) sessionStorage.setItem('totalVideosWatched', (+totalVideosWatched + 1).toString())
      player.propagateContentEvent(PLAY_NEXT_VIDEO)

      player.playNewVideo({
        ...nextParseService,
        isExitFullWindowEnabled,
        mustPlayFullScreen,
        mustPlayFullWindow,
        ...attributes,
        isNextVideo: true,
        previousVideoTitle: nextVideoTitle,
        nextVideoTitle: nextService.title
      }, forceAutoplay)
    } else if (services[NEXT].response && platform === 'mtweb') {
      onNextVideoChange(nextVideoCarousel).then(
        (res) => {
          if (res.allowed) {
            if (totalVideosWatched) sessionStorage.setItem('totalVideosWatched', (+totalVideosWatched + 1).toString())
            player.propagateContentEvent(PLAY_NEXT_VIDEO)
            player.playNewVideo({
              ...attributes,
              ...nextParseService,
              carouselType,
              selectedCardIndex,
              isExitFullWindowEnabled,
              mustPlayFullScreen,
              mustPlayFullWindow,
              isNextVideo: true,
              previousVideoTitle: nextVideoTitle,
              nextVideoTitle: nextService.title
            }, !res.xdr && forceAutoplay)
          } else {
            player.error()
          }
        },
        (reason) => {
          player.error({
            type: parseProgramChangeError(reason && reason.type)
          })
        }
      )
    }
  }
}
