import ko from 'knockout'

import 'comment'

ko.components.register('comment-list', {
  viewModel: function(params) {
    this.comments = params.comments
  },

  template: `<ul data-bind='foreach: comments'>
    <comment params='author: author, text: text'></comment>
  </ul>`
})
