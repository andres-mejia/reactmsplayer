export function handleChatBottonClick(player) {
  return() => {
    const { onChatButtonChange } = player.props
    const { configChatButton } = player.state
    const idVideo = player.state.id
    const stateButton = !configChatButton.state

    if(onChatButtonChange) {
      onChatButtonChange({ idVideo, stateButton })
    }
  }
}
