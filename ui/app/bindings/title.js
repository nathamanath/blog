import ko from 'knockout'

let baseTitle

ko.bindingHandlers.title = {

  init: function(el, valueAccessor, allBindings, viewModel, bindingContext) {
    baseTitle = document.title
  },

  update: function(el, valueAccessor, allBindings, viewModel, bindingContext) {
    let pageTitle = ko.unwrap(valueAccessor())

    document.title = pageTitle ? `${pageTitle} | ${baseTitle}` : baseTitle
  }
}
