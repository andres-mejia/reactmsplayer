import React from 'react'
import { PropTypes } from 'prop-types'
import styles from './floatingTopBar.css'


class FloatingTopBar extends React.Component {

    renderCloseBtn() {
        const { onCloseFloatingVideo } = this.props
        return (
            <div data-agth='playerCloseButton' onClick={onCloseFloatingVideo} className={styles.padButton}>
                <div className={[styles.bt, styles.closeBt].join(' ')} />
            </div>
        )
    }

    renderShrinkBtn() {
        const { onShrinkFloatingVideo, isShrinked } = this.props
        return (
            <div data-agth='playerShrinkButton' onClick={onShrinkFloatingVideo} className={styles.padButton}>
                <div className={[styles.bt, styles.shrinkBt, isShrinked ? styles._active : styles._inactive].join(' ')} />
            </div>
        )
    }


    render() {
        const { isSticky } = this.props
        // añadir comprobante de is es movil y si es flotante
        return isSticky ? (
            <div className={styles.container}>
                {this.renderShrinkBtn()}
                {this.renderCloseBtn()}
            </div>
        ) : null
    }

}

FloatingTopBar.propTypes = {
    isShrinked: PropTypes.bool,
    isSticky: PropTypes.bool,
    onCloseFloatingVideo: PropTypes.func,
    onShrinkFloatingVideo: PropTypes.func,
}

export default FloatingTopBar