import Crossroads from 'crossroads'
import App from 'app'

import '../components/home'

Crossroads.addRoute('', () => {
  App.pageClass('')
  App.pageTitle('')
  App.getPage('home', { url: `/index.json` })
})
