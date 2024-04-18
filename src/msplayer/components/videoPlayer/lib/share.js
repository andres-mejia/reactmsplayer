import { stages } from '../../../commons/types'

export function openDialogShare(player) {
  return () => {
    player.pause()
    player.setState({
      isDialogShareVisible: true,
      isStandByPlaying: player.state.isPlaying
    })
  }
}

export function closeDialogShare(player) {
  return () => {
    const { isStandByPlaying, stage } = player.state

    switch(stage) {
      case stages.PLAYBACK:
        if(isStandByPlaying) {
          player.play()
        }
        break
    }
    player.setState({
      isDialogShareVisible: false,
      isStandByPlaying: false
    })
  }
}
