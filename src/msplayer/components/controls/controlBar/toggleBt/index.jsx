// Libs
import React from 'react'
import { PropTypes } from 'prop-types'
import classNames from 'classnames/bind'
import { isMobileAny } from '../../../../commons/userAgent'

// Styles
import styles from './toggleBt.css'

const cx = classNames.bind(styles)

/**
 * Render a toggle button
 * @return {Component}
 */
const ToggleBt = ({ children, description, state, iconNameInitial, iconNameToggled, onToggle }) => {
  const icon = state ? iconNameToggled : iconNameInitial
  const styleTag = cx({ 
    'button': true, 
    [`${ icon }`]: true, 
    'touchDevice': isMobileAny() 
  })

  return (
    <button
      data-agth={ description }
      className={ styleTag }
      onClick={ () => onToggle(true) }
    />
  )
}

ToggleBt.propTypes = {
  description: PropTypes.string,
  iconNameInitial: PropTypes.string,
  iconNameToggled: PropTypes.string,
  onToggle: PropTypes.func,
  state: PropTypes.bool
}

export default ToggleBt
