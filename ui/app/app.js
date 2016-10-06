import ko from 'knockout'
import Router from 'router'

import 'controllers/home'
import 'controllers/articles'

import 'bindings'

let App = {

  API_URL: 'http://b1522745.ngrok.io',

  pageComponent: ko.observable('home'),
  pageParams: ko.observable({}),
  pageClass: ko.observable(),
  pageTitle: ko.observable(),

  pageLoading: ko.observable(false),

  getPage: (component, params) => {
    params = params || {}

    // Call this after async content loaded
    params.onComponentPageLoaded = () => {
      App.pageLoading(false)
    }

    App.pageLoading(true)
    App.pageComponent(component)
    App.pageParams(params)
  },

  init: () => {
    Router.init()
    ko.applyBindings(App, document.getElementById("htmlTop"))
  }

}

export default App
