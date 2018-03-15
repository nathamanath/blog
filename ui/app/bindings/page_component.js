import ko from 'knockout'

const SHOW_CLASS = 'animate-in'

ko.bindingHandlers.pageComponent = {
  init: function(el, valueAccessor, allBindings, viewModel, bindingContext) {
    let value = valueAccessor()
    let componentName = value.name
    let actualComponentName = ko.observable(componentName())

    // Get transition changing between pages with same template
    componentName.extend({ notify: 'always' })

    el.addEventListener('animationend', () => {
      el.classList.remove(SHOW_CLASS)
      // Take on actual height with new content
      el.style.height = ''
    })

    componentName.subscribe((newComponent) => {

      // Keep current height so that footer dosent jump up the  page
      el.style.height = `${el.offsetHeight}px`

      // Vanish
      window.scroll(0, 0)

      // Change page content
      actualComponentName(newComponent)

      // TODO: Handle loading state... callback to page component to signal ready.

      // Re-appear
      el.classList.add(SHOW_CLASS)

    })

    // Use component binding to handle actual component changes :)
    ko.bindingHandlers.component.init(el, () => {
      return { name: actualComponentName, params: value.params }
    }, allBindings, viewModel, bindingContext)
  }
}
