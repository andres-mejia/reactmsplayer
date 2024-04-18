import React, { Component } from 'react'
import { actionFeedbacks } from '../../commons/types'
import styles from './actionFeedback.css'

const { ACTION_PAUSE, ACTION_PLAY } = actionFeedbacks

class ActionFeedback extends Component {
  constructor(props) {
    super(props)

    this.state = {
      children: []
    }
  }

  showFeedback(action) {
    const { children } = this.state
    const index = children.length

    let iconName = undefined

    switch(action) {
      case ACTION_PAUSE:
        iconName = styles.iconPause
        break

      case ACTION_PLAY:
        iconName = styles.iconPlay
        break
    }

    if(iconName) {
      this.setState({
        children: [
          ...children,
          <div
            key={ `${iconName}__${Math.round(Math.random() * 1000)}` }
            className={ `${styles.icon} ${iconName}` }
          />
        ]
      }, () => window.setTimeout( () => {
        this.setState({
          children: [ ...children ].splice(index)
        })
      }, 1500))
    }
  }

  render() {
    const { children } = this.state

    return (
      children.length ?
        <div className={ styles.container }>
          { children }
        </div>
      :
        null
    )
  }
}

export default ActionFeedback
