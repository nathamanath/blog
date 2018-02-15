import crossroads from 'crossroads'

import 'historyjs/scripts/uncompressed/history'
import 'historyjs/scripts/uncompressed/history.adapter.native'

export default {
  init: (App) => {

    let State

    crossroads.parse(document.location.pathname + document.location.search)

    crossroads.bypassed.add((route) => {
      alert('Not found.')
    })

    History = window.History

    if(History.enabled) {
      State = History.getState()

      // set initial state to first page that was loaded
      History.pushState(
        {urlPath: window.location.pathname},
        '',
        State.urlPath
      )
    } else{
      return false
    }

    History.Adapter.bind(window, 'statechange', () => {
      crossroads.parse(document.location.pathname + document.location.search)
    })

    document.body.addEventListener('click', (e) => {

      let target = e.target

      while(target.tagName !== 'BODY') {

        if(target.tagName === 'A') {

          let href = target.getAttribute('href')

          if(href.match(/^\//)) {

            e.preventDefault()

            History.pushState(
              { urlPath: href },
              '',
              href
            )

            return false
          }
        }

        target = target.parentNode
      }
    })

  }

}
