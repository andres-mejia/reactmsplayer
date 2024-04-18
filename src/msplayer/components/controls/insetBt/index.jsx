import React from 'react'
import { PropTypes } from 'prop-types'
import { isMobileAny } from '../../../commons/userAgent'
import styles from './insetBt.css'

const InsetBt = ({ description, onClick, position, type }) => (
  <button
    data-agth={ description }
    className={ `${styles.bt}${position ? ` ${styles[position]}` : ''}${type ? ` ${styles[type]}` : ''} ${isMobileAny() ? `${styles.touchDevice}` : '' }` }
    onClick={ onClick }
  />
)

InsetBt.propTypes = {
  description: PropTypes.string,
  onClick: PropTypes.func,
  position: PropTypes.string,
  type: PropTypes.string
}

export default InsetBt
