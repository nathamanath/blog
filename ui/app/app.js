import ko from 'knockout'
import Router from 'router'

import 'controllers/home'
import 'controllers/articles'

import 'bindings'

let App = {

  pageComponent: ko.observable('home'),
  pageParams: ko.observable({}),
  pageClass: ko.observable(),
  pageTitle: ko.observable(),

  pageLoading: ko.observable(false),

  getPage: (component, params, async = true) => {
    params = params || {}

    if(async) {
      // Call this after async content loaded
      params.onComponentPageLoaded = () => {
        App.pageLoading(false)
      }

      App.pageLoading(true)
    }

    App.pageComponent(component)
    App.pageParams(params)
  },

  init: () => {
    Router.init(App)
    ko.applyBindings(App, document.getElementById("htmlTop"))
  }

}

export default App
