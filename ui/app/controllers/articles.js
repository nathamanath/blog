import Crossroads from 'crossroads'
import App from 'app'

import '../components/article'

Crossroads.addRoute('{year}/{slug}', (year, slug) => {

  let url = `${App.API_URL}/${year}/${slug}.json`

  App.getPage('article', {
    url: url,
    pageClassAccessor: App.pageClass,
    pageTitleAccessor: App.pageTitle
  })

})
