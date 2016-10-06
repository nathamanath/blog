import hasher from 'hasher'
import crossroads from 'crossroads'

const parseHash = (newHash, oldHash) => {
  crossroads.parse(newHash)
}

const inithasher = () => {
  hasher.initialized.add(parseHash)
  hasher.changed.add(parseHash)

  hasher.init()

  // Default to /#/ for neatness
  if(!window.location.hash) { window.location.hash = '/' }
}

export default {
  init: () => {
    inithasher()
  }

}
