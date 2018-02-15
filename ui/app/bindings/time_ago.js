import ko from 'knockout'
import TimeAgo from '../lib/time_ago'

let timeAgo

ko.bindingHandlers.timeAgo = {

  update: function(el, valueAccessor, allBindings, viewModel, bindingContext) {
    let time = ko.unwrap(valueAccessor())

    if(timeAgo) {
      timeAgo.destroy()
    }

    timeAgo = new TimeAgo(el, time)
  }
}
