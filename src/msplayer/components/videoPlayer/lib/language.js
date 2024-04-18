import { isIPad, isMobilePhone, isTablet } from '../../../commons/userAgent'

export function setAudioTrack(player) {
  return (track) => {
    // Se debería esperar a que cambiara el audio en el media player 
    // pero puede ser lento y resultar confuso para el usuario 
    // el que no se actualice en el menú de la barra de control inmediatamente.
    // Por eso se setea directamente aquí
    player.setState({
      currentAudioTrack: track,
      isDialogAudioSubtitlesDesktopVisible: false
    })
    if(player.videoInstance) {
      player.videoInstance.setAudioTrack(track)
    }

    if (!(isMobilePhone() || isIPad() || isTablet())) {
      player.play()
    }
  }
}
