import fetch from 'isomorphic-fetch'
import { parse as parseVtt } from 'subtitle'
import { isIPad, isMobilePhone, isTablet } from '../../../commons/userAgent'
import { errorTypes } from '../../../commons/types'
import { streamEvents } from '../../../commons/types/events'

const { ERROR_FETCH } = errorTypes
const { SUBTITLE_TRACK_CHANGED } = streamEvents

export function handleSubtitlesChange(player) {
  return (selected) => {
    const {
      isDialogAudioSubtitlesMobileVisible,
      isDialogAudioSubtitlesDesktopVisible,
      subtitles,
      isLive
    } = player.state

    const logger = player.getLogger('subtitles')

    player.setState({
      subtitles: {
        ...subtitles,
        currentSubtitles: undefined,
        selected: { ...selected }
      }
    })

    logger.info('Handle subtitles change', selected)
    if (!isLive) {
      const storeSubs = (parsedVtt) => {
        player.setState({
          subtitles: {
            ...player.state.subtitles,
            config: player.state.subtitles.config.map((item) => (
              item.language === selected.language ? { ...item, parsedVtt } : item
            )),
            currentSubtitles: parsedVtt
          }
        }, () => {
          player.propagateStreamEvent(SUBTITLE_TRACK_CHANGED,
            { language: selected?.language, name: selected?.name })
        })
      }

      if (selected.vtt) {
        player.requestVtt(selected.vtt)
          .then((vtt) => {
            let parsedVtt = undefined

            try {
              parsedVtt = parseVtt(vtt)
            } catch (e) {
              logger.error('Error al parsear VTT', { error: e.toString(), selected })
            }

            storeSubs(parsedVtt)
          })
          .catch((error) => logger.error('Error al recuperar VTT', { error, selected }))
      } else {
        player.propagateStreamEvent(SUBTITLE_TRACK_CHANGED,
          { language: selected?.language, name: selected?.name })
      }
    } else if (player.videoInstance) {
      player.videoInstance.setSubtitleTrack(selected)
    }

    if (!(isMobilePhone() || isIPad() || isTablet())) {
      player.play()
    }

    if (!isDialogAudioSubtitlesMobileVisible) {
      player.setState({
        isDialogAudioSubtitlesDesktopVisible: !isDialogAudioSubtitlesDesktopVisible
      })
    }
  }
}

export function openDialogAudioSubtitlesDesktop(player) {
  return () => {
    const { isDialogAudioSubtitlesDesktopVisible } = player.state
    if (isDialogAudioSubtitlesDesktopVisible) {
      player.play()
    } else {
      player.pause()
    }
    player.setState({
      isDialogAudioSubtitlesDesktopVisible: !isDialogAudioSubtitlesDesktopVisible
    })
  }
}

export function closeDialogAudioSubtitlesDesktop(player) {
  return () => {
    player.play()
    player.setState({
      isDialogAudioSubtitlesDesktopVisible: false
    })
  }
}

export function openDialogAudioSubtitlesMobile(player) {
  return () => {
    player.pause()
    player.setState({
      isDialogAudioSubtitlesMobileVisible: true
    })
  }
}

export function closeDialogAudioSubtitlesMobile(player) {
  return () => {
    player.play()
    player.setState({
      isDialogAudioSubtitlesMobileVisible: false
    })
  }
}

export function requestVtt(player) {
  return (url) => {
    return new Promise((resolve, reject) => {
      const headers = {
        'Content-Type': 'text/plain'
      }

      fetch(url, {
        headers
      })
      .then((response) => {
        if(response.ok) {
          return response.text()
        }
        throw {
          message: `GET ${url} ${response.status} ${response.statusText}`,
          response
        }
      })
      .then((vtt) => {
        resolve(vtt)
      })
      .catch((error) => {
        reject({
          type: ERROR_FETCH,
          info: {
            message: error.message,
            status: error.response && error.response.status
          },
          response: error.response
        })
      })
    })
  }
}
