import ko from 'knockout'

ko.components.register('article-preview', {
  viewModel: function(params) {

    this.title = params.title
    this.createdAt = params.createdAt
    this.preview = params.preview
    this.path = params.path
    this.themeClass = params.themeClass

  },

  template: `
    <article class="article-preview" data-bind="css: themeClass">

      <header>
        <a data-bind="attr: { href: path }">
          <h2 data-bind="text: title"></h2>
        </a>
      </header>

      <div data-bind="text: preview"></div>

      <footer>
        <p>
          Created <time data-bind="timeAgo: createdAt"></time>
        </p>
      </footer>

    </article>
  `
})
