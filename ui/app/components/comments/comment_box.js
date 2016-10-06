import ko from 'knockout'
import Ajax from 'ajax'

import 'comment_list'
import 'comment_form'

ko.components.register('comment-box', {
  viewModel: function(params) {

    this.comments = ko.observableArray()

    this.handleAddComment = (comment) => {
      this.comments.push(comment)

      // TODO: post to server
    }

    Ajax.request({
      url: params.url,
      onSuccess: (xhr) => {
        this.comments(JSON.parse(xhr.responseText))
      }
    })
  },

  template: `
    <div class="comment-box">
      <h1>Comments</h1>

      <comment-list params='comments: comments'></comment-list>
      <comment-form params='handleAddComment: handleAddComment'></comment-form>
    </div>
  `
})
