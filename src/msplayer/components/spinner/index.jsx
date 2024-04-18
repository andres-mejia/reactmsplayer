import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import styles from './spinner.css'

const DEFAULT_DELAY_DESCRIPTION = 10000
const DEFAULT_DELAY_ICON = 2000

class Spinner extends Component {
  constructor(props) {
    super(props)

    this.descriptionTimeout = null
    this.iconTimeout = null

    this.state = {
      isDescriptionVisible: props.descriptionDelay === 0,
      isIconVisible: props.iconDelay === 0
    }
  }

  componentDidMount() {
    const { descriptionDelay, iconDelay, isProcessing } = this.props

    if(isProcessing) {
      this.startDescriptionTimeout(descriptionDelay)
      this.startIconTimeout(iconDelay)
    }
  }

  componentDidUpdate(prevProps) {
    const { description, descriptionDelay, iconDelay, isProcessing } = this.props

    if(isProcessing && !prevProps.isProcessing ||
      descriptionDelay !== prevProps.descriptionDelay ||
      description !== prevProps.description
    ) {
      this.startDescriptionTimeout(descriptionDelay)
    }
    if(isProcessing && !prevProps.isProcessing || iconDelay !== prevProps.iconDelay) {
      this.startIconTimeout(iconDelay)
    }
  }

  componentWillUnmount() {
    if(this.descriptionTimeout){
      clearTimeout(this.descriptionTimeout)
    }
  }

  startDescriptionTimeout(delay) {
    this.setState({
      isDescriptionVisible: false
    })

    if(this.descriptionTimeout){
      clearTimeout(this.descriptionTimeout)
    }
    this.descriptionTimeout = window.setTimeout(() => {
      this.setState({
        isDescriptionVisible: true
      })
    }, delay === undefined ? DEFAULT_DELAY_DESCRIPTION : delay)
  }

  startIconTimeout(delay) {
    this.setState({
      isIconVisible: false
    })

    if(this.iconTimeout){
      clearTimeout(this.iconTimeout)
    }
    this.iconTimeout = window.setTimeout(() => {
      this.setState({
        isIconVisible: true
      })
    }, delay === undefined ? DEFAULT_DELAY_ICON : delay)
  }

  render() {
    const { description, isProcessing } = this.props
    const { isDescriptionVisible, isIconVisible } = this.state

    return (
      <div className={ `${styles.container} ${isProcessing && isIconVisible ? styles.visible : styles.hidden}` }>
        <div className={ styles.spinnerIcon } />
        <div className={ `${styles.message} ${isDescriptionVisible ? styles.visible : styles.hidden}` }>
          { description }
        </div>
      </div>
    )
  }
}

Spinner.propTypes = {
  description: PropTypes.string,
  descriptionDelay: PropTypes.number,
  iconDelay: PropTypes.number,
  isProcessing: PropTypes.bool
}

export default Spinner
