import React from 'react'
import { PropTypes } from 'prop-types'
import styles from './adPause.css'

const AdPause = ({
  src,
  link,
  alt,
  title,
  className,
  imageClassName,
  imageRef,
  setImageClassName
}) => {
  const containerClassName = className === 'portrait' || className === 'landscape' ? `${className}__${imageClassName}` : className
  return (
    <div className={ `${styles.container} ${styles[containerClassName]}` }>
      { link ? (
        <a href={ link } target={ '_blank' } rel={ 'noreferrer' }>
          <img ref={ imageRef } className={ `${styles.adImage} ${styles[imageClassName]}` } src={ src } alt={ alt } title={ title } onLoad={ () => setImageClassName() } />
        </a>
      )
        : <img ref={ imageRef } className={ `${styles.adImage} ${styles[imageClassName]}` } src={ src } alt={ alt } title={ title } onLoad={ () => setImageClassName() } />}
    </div>
  )
}

AdPause.propTypes = {
  src: PropTypes.string.isRequired,
  link: PropTypes.string,
  alt: PropTypes.string,
  title: PropTypes.string,
  className: PropTypes.oneOf(['portrait', 'landscape', 'hiddenContainer']),
  imageClassName: PropTypes.oneOf(['high', 'wide'])
}

AdPause.defaultProps = {
  link: '',
  alt: 'Publicidad',
  title: 'Publicidad',
  className: 'hiddenContainer',
  imageClassName: 'high'
}

export default AdPause
