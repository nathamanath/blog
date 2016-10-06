import ko from 'knockout'
import Remarkable from 'remarkable'

ko.components.register('comment', {
  viewModel: function(params) {

    this.author = params.author

    this.text = ko.computed(() => {
      let md = new Remarkable()
      return md.render(params.text)
    })

  },

  template: `
    <h2 data-bind="text: author"></h2>
    <div data-bind="html: text"></div>
  `
})
