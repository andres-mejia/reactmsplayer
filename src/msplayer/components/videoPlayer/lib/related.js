import { playerModes, playerTypes, serviceNames } from '../../../commons/types'

const { PREVIEW } = playerModes
const { AUDIO_PLAYER } = playerTypes
const { RELATED_VIDEOS } = serviceNames

export function isRelatedAutoplayEnabled(player) {
  return () => {
    const {
      isRelatedAutoplayEnabled,
      isRelatedEnabled,
      mode,
      services,
      type
    } = player.state

    const relatedVideos = services[RELATED_VIDEOS].response && services[RELATED_VIDEOS].response.videos

    return (
      mode !== PREVIEW &&
      type !== AUDIO_PLAYER &&
      isRelatedAutoplayEnabled && isRelatedEnabled && relatedVideos && Array.isArray(relatedVideos) && relatedVideos.length
    )
  }
}

export function openDialogRelated(player) {
  return () => player.setState({
    isDialogRelatedVisible: true
  })
}

export function parseRelatedAttributesMitele() {
  return (attributes) => {
    const {
      config, id, mediaId, mustPlayFullWindow, images: { thumbnail }, parent, title
    } = attributes

    const { src } = thumbnail

    return {
      configUrl: config,
      cmsId: 'bcube',
      config,
      id,
      mediaId,
      editorialId: parent.id,
      mustPlayFullWindow,
      parent,
      poster: src,
      src,
      title
    }
  }
}

export function parseRelatedAttributesMultisite() {
  return (attributes) => {
    const {
      cmsId, configUrl, editorialId, id, mediaId, mustPlayFullWindow, poster, title
    } = attributes

    return {
      cmsId,
      configUrl,
      editorialId,
      // NOTA: Si se setea el id hace que el player se resetee como
      // si hubiera empezado a reproducirse otro player en la página
      // id,
      mediaId,
      mustPlayFullWindow,
      poster
      // NOTA: Este title sobreescribe el de los servicios de datos en VoD
      // title
    }
  }
}
