import ko from 'knockout'

ko.components.register('comment-form', {
  viewModel: function(params) {

    this.author = ko.observable()
    this.text = ko.observable()

    this.handleSubmit = () => {

      if(!this.author() || !this.text()) {
        return
      }

      let comment = {author: this.author(), text: this.text()}

      params.handleAddComment(comment)

      this.author('')
      this.text('')
    }
  },

  template: `
    <form class="comment-form" data-bind="submit: handleSubmit">
      <input placeholder="name" data-bind='value: author'>
      <textarea placeholder="say things" data-bind='value: text'></textarea>

      <button>Submit</button>
    </form>`
})
