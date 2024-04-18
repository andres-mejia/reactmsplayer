import {
  isFullScreen as isFullScreenElement,
  enterFullScreen as enterFullScreenElement,
  exitFullScreen as exitFullScreenElement,
  toggleFullScreen as toggleFullScreenElement
} from '../../../commons/util'
import { isAndroid, isIos } from '../../../commons/userAgent'
import { globalEvents, playerEvents } from '../../../commons/types/events'
import { stages } from '../../../commons/types'

const { PLAYER_TOGGLE_FULL_SCREEN, PLAYER_TOGGLE_FULL_WINDOW } = globalEvents
const { PLAYER_TOGGLE_FULL_SCREEN_BT_CLICK } = playerEvents
const { END, ERROR } = stages

function callToggleAdShape(toggleAdShape, player) {
  if ((!player.state.isFullScreen && !player.state.isFullWindow)) {
    toggleAdShape(false)
  } else if ((player.state.isFullScreen || player.state.isFullWindow)) {
    toggleAdShape(true)
  }
}

export function applyPlaybackRequirements(player) {
  return () => {
    const { isFullWindow, mustPlayFullScreen, mustPlayFullWindow } = player.state
    const { ref } = player

    const logger = player.getLogger('maximize')

    const element = isIos() ? player.videoInstance && player.videoInstance.getRef() : ref

    logger.info('Apply playback requirements', {
      element: !!(element),
      isFullScreenElement: isFullScreenElement(element),
      isFullWindow,
      mustPlayFullScreen,
      mustPlayFullWindow
    })

    if(mustPlayFullScreen && !isFullScreenElement(element)) {
      player.enterFullScreen()
    } else if(mustPlayFullWindow && !isFullWindow) {
      player.enterFullWindow()
    }
  }
}

export function enterFullScreen(player) {
  return () => {
    const logger = player.getLogger('maximize')
    const { ref } = player
    const { onScreenChange, toggleAdShape } = player.props

    const element = isIos() ? player.videoInstance.getRef() : ref
    const isFullScreen = enterFullScreenElement(element)

    logger.info('Enter full-screen', {
      element: !!(element),
      isFullScreen
    })

    player.setState({ isFullScreen })

    if(onScreenChange) {
      onScreenChange('fullscreen')
    }

    if (toggleAdShape) {
      callToggleAdShape(toggleAdShape, player)
    }
  }
}

export function exitFullScreen(player) {
  return () => {
    const { mustPlayFullScreen, stage } = player.state
    const { ref } = player
    const { onScreenChange, toggleAdShape } = player.props

    const logger = player.getLogger('maximize')

    const element = isIos() ? player.videoInstance.getRef() : ref

    logger.info('Exit full-screen', {
      element: !!(element),
      mustPlayFullScreen,
      stage
    })

    exitFullScreenElement(element)

    if(stage === END || stage === ERROR) {
      player.reset()
    } else if(mustPlayFullScreen) {
      player.pause()
    }

    player.setState({
      isFullScreen: false
    }, () => {
      if(onScreenChange) {
        onScreenChange(player.state.isFullWindow ? 'fullwindow' : 'none')
      }

      if (toggleAdShape) {
        callToggleAdShape(toggleAdShape, player)
      }
    })
  }
}

export function enterFullWindow(player) {
  return () => {
    const logger = player.getLogger('maximize')
    const { onScreenChange, toggleAdShape } = player.props
    logger.info('Enter full-window')

    document.body.style.setProperty('overflow', 'hidden')

    player.setState({
      isFullWindow: true
    }, () => {
      player.handleWindowResize()
      player.propagateGlobalEvent(PLAYER_TOGGLE_FULL_WINDOW, {isFullWindow: true})
    })

    if(onScreenChange) {
      onScreenChange('fullwindow')
    }

    if (toggleAdShape) {
      callToggleAdShape(toggleAdShape, player)
    }
  }
}

export function exitFullWindow(player) {
  return () => {
    const { stage } = player.state
    const { onScreenChange, toggleAdShape } = player.props

    const logger = player.getLogger('maximize')
    logger.info('Exit full-window')

    document.body.style.setProperty('overflow', '')

    player.setState({
      isFullWindow: false
    }, () => {
      if(stage === END || stage === ERROR) {
        player.reset()
      } else {
        player.pause()
      }
      player.handleWindowResize()
      window.setTimeout( () => player.handleWindowResize(), 1 )

      player.propagateGlobalEvent(PLAYER_TOGGLE_FULL_WINDOW, {isFullWindow: false})

      if(onScreenChange) {
        onScreenChange('none')
      }

      if (toggleAdShape) {
        callToggleAdShape(toggleAdShape, player)
      }
    })
  }
}

export function toggleFullScreen(player) {
  return () => {
    const { isAlreadyClickMessage, isFullScreenDelegated } = player.state
    const { onScreenChange, toggleAdShape } = player.props
    const { ref } = player

    const logger = player.getLogger('maximize')
    logger.info('Toggle full-screen', {
      isFullScreenDelegated
    })

    if(isFullScreenDelegated) {
      player.propagateGlobalEvent(PLAYER_TOGGLE_FULL_SCREEN)
    } else {
      const element = isIos() ? player.videoInstance.getRef() : ref
      const isFullScreen = toggleFullScreenElement(element)

      logger.info('Apply toggle full-screen', {
        element: !!(element),
        isFullScreen
      })

      player.setState({
        isFullScreen
      }, () => {
        if(onScreenChange) {
          onScreenChange(player.state.isFullScreen ? 'fullscreen' : player.state.isFullWindow ? 'fullwindow' : 'none')
        }

        if (toggleAdShape) {
          callToggleAdShape(toggleAdShape, player)
        }
      })

      if(!isAlreadyClickMessage) {
        player.setState({
          isAlreadyClickMessage: true
        })
      }
    }
  }
}

export function handleFullScreenChange(player) {
  return () => {
    const { isFullWindow, mustPlayFullScreen } = player.state
    const { onScreenChange, toggleAdShape } = player.props
    const { ref } = player

    const logger = player.getLogger('maximize')
    logger.info('Handle full-screen change')

    const element = isIos() ? player.videoInstance && player.videoInstance.getRef() : ref

    const isFullScreen = isFullScreenElement(element)

    logger.info('Apply full-screen change', {
      element: !!(element),
      isFullScreen,
      isFullWindow,
      mustPlayFullScreen
    })

    if(!isFullScreen && mustPlayFullScreen && !isFullWindow) {
      player.pause()
    }

    if(element) {
      player.setState({
        isFullScreen
      })
    }
    if(onScreenChange) {
      let isNone = (!player.state.isFullScreen && !player.state.isFullWindow)
      if(isNone) {
        onScreenChange('none')
      }
    }

    window.setTimeout(() => {
      if (toggleAdShape) {
        callToggleAdShape(toggleAdShape, player)
      }
    }, 2000)
  }
}

export function handleToggleFullScreenBtClick(player) {
  return () => {
    const logger = player.getLogger('maximize')
    logger.info('Handle toggle full-screen bt click')

    player.toggleFullScreen()

    if(!isAndroid()) {
      player.propagatePlayerEvent(PLAYER_TOGGLE_FULL_SCREEN_BT_CLICK)
    }
  }
}
