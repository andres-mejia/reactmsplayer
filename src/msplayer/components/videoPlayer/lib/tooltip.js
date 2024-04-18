export function handleMessageClick(player) {
  return() => {
    player.setState({
      isAlreadyClickMessage: true
    })
  }
}
