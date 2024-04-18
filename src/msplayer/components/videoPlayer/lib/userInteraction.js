import { getElementPosition, getMousePosition, isInBoundary } from '../../../commons/util'
import { isMobileAny } from '../../../commons/userAgent'
import { themes } from '../../../commons/types'

const { MOBILE } = themes

export function handleClickEmpty(player) {
  return () => {
    const { isControlBarVisible, isFullScreen, isToggleOn, isButtonVisible, processButtonVisible } = player.state
    const { onControlBarVisibleChange } = player.props

    if (player.hideControlsTimeout) {
      clearTimeout(player.hideControlsTimeout)
    }
    
    player.setState({
      isButtonVisible: !processButtonVisible ? true : !isButtonVisible,
      isControlBarVisible: !isControlBarVisible,
      isCursorVisible: !isFullScreen,
      isToggleOn: isControlBarVisible && isButtonVisible ? false : isToggleOn,
      processButtonVisible: true
    })

    if(!isControlBarVisible) {
      player.startHideControlsTimeout()
    }
    
    if(onControlBarVisibleChange) onControlBarVisibleChange(!isControlBarVisible)
  }
}

export function handleFocus(player) {
  return (e) => {
    e.stopPropagation()

    player.handleUserInteraction()

    player.setState({
      hasFocus: true
    })
  }
}

export function handlePlayerMouseMove(player) {
  return (e) => {
    const { isToggleOn } = player.state
    const mouseP = getMousePosition(e)

    player.setState({
      mouseX: mouseP.x,
      mouseY: mouseP.y
    }, () => !isToggleOn && player.handleUserInteraction())
  }
}

export function handleUserInteraction(player) {
  return () => {
    const { isContentStarted, isPlaying, isToggleOn } = player.state
    const { onControlBarVisibleChange } = player.props
    if (player.hideControlsTimeout) {
      clearTimeout(player.hideControlsTimeout)
    }

    if(isPlaying || (isMobileAny() && isContentStarted) ){
      player.setState({
        isButtonVisible: true,
        isControlBarVisible: true,
        isCursorVisible: true,
        processButtonVisible: true
      })

      if(onControlBarVisibleChange) onControlBarVisibleChange(true)
      !isToggleOn && player.startHideControlsTimeout()
    }
  }
}

export function handleClearTimeOut(player) {
  return () => {
    const { onControlBarVisibleChange } = player.props
    const { isToggleOn } = player.state
    if (player.hideControlsTimeout) {
      clearTimeout(player.hideControlsTimeout)
    }

    if (isToggleOn) {
      player.startHideControlsTimeout()
    }

    player.setState({
      isButtonVisible: true,
      isControlBarVisible: isToggleOn ? true : false,
      isCursorVisible: isToggleOn ? true : false
    })

    if(onControlBarVisibleChange) onControlBarVisibleChange(true)
  }
  
}

export function handleWindowClick(player) {
  return () => {
    player.setState({
      hasFocus: false
    })
  }
}

export function startHideControlsTimeout(player) {
  return () => {
    const { isAutoHideControlBarEnabled, processButtonVisible, platform, formatType, isControlBarVisible } = player.state
    const { onControlBarVisibleChange } = player.props

    const HIDE_TIMEOUT_PC = 1000
    const HIDE_TIMEOUT_MOBILE = processButtonVisible
      ? 4000
      : platform === 'mtweb' && formatType === 'short'
        ? isControlBarVisible
          ? 4000
          : 0
        : 4000

    const HIDE_TIMEOUT_PC_BUTTON_CAROUSEL = processButtonVisible
      ? 4000
      : platform === 'mtweb' && formatType === 'short'
        ? 3000
        : 4000

    const HIDE_TIMEOUT_MOBILE_BUTTON_CAROUSEL = processButtonVisible
      ? 4000
      : platform === 'mtweb' && formatType === 'short'
        ? 2000
        : 4000

    if(typeof isAutoHideControlBarEnabled === 'undefined' || isAutoHideControlBarEnabled) {
      if (player.hideControlsTimeout) {
        clearTimeout(player.hideControlsTimeout)
      }

      player.hideControlsTimeout = window.setTimeout(() => {
        const { 
          isPlaying, 
          isFullScreen, 
          isFullWindow, 
          isScrubbing,
          isToggleOn,
          theme
        } = player.state

        if (
          (isPlaying || (theme === MOBILE && (isFullScreen || isFullWindow))) && 
          !isScrubbing
        ) {
          player.setState({
            isControlBarVisible: isMobileAny() ? false : isToggleOn ? true : false,
            isCursorVisible: !isFullScreen
          })
          if(onControlBarVisibleChange) onControlBarVisibleChange(false)
        }
        player.hideControlsTimeout = null
        player.hideControlsTimeout = window.setTimeout(() => {
          if (
            (isPlaying || (theme === MOBILE && (isFullScreen || isFullWindow))) && 
            !isScrubbing
          ) {
            player.setState({
              isButtonVisible: isToggleOn ? true : false,
              processButtonVisible: true
            })
          }
        }, isMobileAny() ? HIDE_TIMEOUT_MOBILE_BUTTON_CAROUSEL : HIDE_TIMEOUT_PC_BUTTON_CAROUSEL)
      }, isMobileAny() ? HIDE_TIMEOUT_MOBILE : HIDE_TIMEOUT_PC)

      player.collector.addTimeout(player.hideControlsTimeout)
      player.collector.addProperty('hideControlsTimeout')

    } else {
      player.setState({
        isButtonVisible: true,
        isControlBarVisible: true,
        isCursorVisible: true
      })
      if(onControlBarVisibleChange) onControlBarVisibleChange(true)
    }
  }
}

export function hideControls(player) {
  return () => {
    const { isFullScreen, isToggleOn } = player.state
    const { onControlBarVisibleChange } = player.props

    player.setState({
      isControlBarVisible: !isToggleOn ? false : true,
      isCursorVisible: !isFullScreen
    })
    if(onControlBarVisibleChange) onControlBarVisibleChange(false)
  }
}
