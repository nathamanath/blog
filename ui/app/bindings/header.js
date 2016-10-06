import ko from 'knockout'
import { throttle, dgid } from '../lib/utils'

const TIMELINE_LENGTH = 300 // px
const HEADER_RANGE = { from: 500, to: 80 }
const LOGO_RANGE = { from: 190, to: 60 }

// @returns % of way through 'timeline'
const getProgress = (scrolled) => {
  return Math.min(((scrolled / TIMELINE_LENGTH) * 100), 100)
}

const gap = (props) => {
  return props.from - props.to
}

const value = (progress, props) => {
  return props.from - (progress / 100) * gap(props)
}

const scrollY = () => {
  return window.scrollY || document.documentElement.scrollTop
}

ko.bindingHandlers.header = {

  init: function(el, valueAccessor, allBindings, viewModel, bindingContext) {

    let container = dgid('container')
    let logo = dgid('logo')

    let update = (progress) => {
      let elHeight = `${value(progress, HEADER_RANGE)}px`

      el.style.height = elHeight
      container.style.paddingTop = elHeight
      logo.style.height = `${value(progress, LOGO_RANGE)}px`
    }

    update(getProgress(scrollY()))

    let onScroll = throttle(function(e) {
      update(getProgress(scrollY()))
    }, (1000/60), this)

    window.addEventListener('scroll', onScroll)

  }

}
