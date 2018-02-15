import ko from 'knockout'
import Ajax from 'ajax'

import 'components/article_preview'

ko.components.register('article-list', {
  viewModel: function(params) {
    this.articles = ko.observableArray();

    Ajax.request({
      url: params.url,
      onSuccess: (xhr) => {
        this.articles(JSON.parse(xhr.responseText))
        params.onLoad.call()
      }
    })
  },

  template: `
    <ul data-bind='foreach: articles' class="article-list">
      <li>
        <article-preview params="{ path: path, title: title, preview: preview, createdAt: created_at, themeClass: theme_class }">
        </article-preview>
      </li>
    </ul>
  `
})
