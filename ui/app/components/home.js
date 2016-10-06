import ko from 'knockout'

import 'components/article_list'

ko.components.register('home', {
  viewModel: function(params) {
    this.articlesURL = params.url
    this.onLoad = params.onComponentPageLoaded
  },

  template: `
    <article-list params="{ url: articlesURL, onLoad: onLoad }"></article-list>
  `
})
