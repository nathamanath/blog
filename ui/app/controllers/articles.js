import Crossroads from 'crossroads'
import App from 'app'

import '../components/article'

Crossroads.addRoute('{year}/{slug}:?query:', (year, slug) => {
  let url = `/${year}/${slug}.json`

  App.getPage('article', {
    url: url,
    pageClassAccessor: App.pageClass,
    pageTitleAccessor: App.pageTitle
  })

})
