import {
  isFullScreenSupported,
  isIPad,
  isIPhonePlaysInline
} from '../../../commons/userAgent'

export function isFullScreenEnabled(player) {
  return () => {
    const { isFullScreenEnabled: fullScreenEnabled } = player.state

    if(fullScreenEnabled === undefined) {
      const mediaElement = isIPhonePlaysInline() || isIPad(true) ? player.videoInstance.getRef() : undefined
      return isFullScreenSupported(mediaElement) || isIPhonePlaysInline()
    } else {
      return fullScreenEnabled
    }
  }
}
