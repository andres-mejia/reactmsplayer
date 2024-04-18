import React from 'react'
import { PropTypes } from 'prop-types'
import { CSSTransitionGroup as ReactCSSTransitionGroup } from 'react-transition-group'
import classNames from 'classnames/bind'
import styles from './dialogTransitionAppear.css'

const cx = classNames.bind(styles)
const transition = {
  appear: cx({ 'dialog-appear': true }),
  appearActive: cx({ 'dialog-appear-active': true })
}

const DialogTransitionAppear = ({ children, name }) => (
  // Appear: cuando se monta el componente
  // Enter: cuando se añade un componente
  // Leave: cuando se elimina un componente
  <ReactCSSTransitionGroup
    className={`${name}__transitionAppear`}
    transitionName={transition}
    transitionAppear={true}
    transitionAppearTimeout={400}
    transitionEnter={false}
    transitionEnterTimeout={400}
    transitionLeave={false}
    transitionLeaveTimeout={300}
    component={ 'div' }
  >
    {children}
  </ReactCSSTransitionGroup>
)

DialogTransitionAppear.propTypes = {
  name: PropTypes.string
}

export default DialogTransitionAppear
