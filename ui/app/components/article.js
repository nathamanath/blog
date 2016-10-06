import ko from 'knockout'
import Ajax from 'ajax'

ko.components.register('article', {
  viewModel: function(params) {

    this.title = ko.observable()
    this.content = ko.observable()
    this.createdAt = ko.observable()
    this.updatedAt = ko.observable()
    this.tldr = ko.observable()
    this.themeClass = ko.observable()
    this.next = ko.observable()
    this.prev = ko.observable()

    // this.commentsUrl = params.commentsUrl

    Ajax.request({
      url: params.url,

      onSuccess: (xhr) => {

        let article = JSON.parse(xhr.responseText)

        this.title(article.title)
        this.content(article.content)
        this.createdAt(article.created_at)
        this.updatedAt(article.updated_at)
        this.tldr(article.tldr)
        this.next(article.next)
        this.prev(article.prev)

        params.pageClassAccessor(article.theme_class)
        params.pageTitleAccessor(article.title)
        params.onComponentPageLoaded.call()

      },

      onError: () => {
        alert('Could not get article. Please try again later.')
      }
    })
  },

  template: `
    <article>

      <header>
        <h1 data-bind="text: title"></h1>
      </header>

      <section class="article-content">
        <div data-bind="html: content"></div>
      </section>

      <footer>

        <div class="tldr" data-bind="with: tldr">
          <h3>tldr:</h3>

          <p data-bind="html: $data"></p>
        </div>

        <p data-bind="visible: createdAt">Created <time data-bind="timeAgo: createdAt"></time></p>
        <p data-bind="visible: updatedAt">Updated <time data-bind="timeAgo: updatedAt"></time></p>

        <ul class="next-prev">
          <li data-bind="visible: next, with: next">
            Next: <a data-bind="text: title, attr: { href: '/#' + path }"></a>
          </li>

          <li data-bind="visible: prev, with: prev">
            Previous: <a data-bind="text: title, attr: { href: '/#' + path }"></a>
          </li>
        </ul>

      </footer>

    </article>
  `
})
