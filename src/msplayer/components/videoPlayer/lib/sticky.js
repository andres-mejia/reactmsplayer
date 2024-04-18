export function handleFloatingClick(player) {
  return () => {
    const { isSticky, isShrinked } = player.props

    player.setState({
      isShrinked: isShrinked,
      isSticky: isSticky
    })
  }
}