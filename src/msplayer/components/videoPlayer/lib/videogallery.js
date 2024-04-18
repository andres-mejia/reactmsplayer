export function handleNextVideoClick(player) {
  return() => {
    const { onNextVideo } = player.props
    const { editorialId } = player.state

    if(onNextVideo) {
      onNextVideo(editorialId)
    }
  }
}
  
export function handlePreviousVideoClick(player) {
  return() => {
    const { onPreviousVideo } = player.props
    const { editorialId } = player.state

    if(onPreviousVideo) {
      onPreviousVideo(editorialId)
    }
  }
}
  