title: Programmatically fire events in javascript
date: 2015-04-17 11:00

I have been working on a replacement range input
as I need a consistent cross browser interface for this. One of the problems to
solve
was how can fire events programmatically on the actual input element, when the
user is interacting with my generated facade, and without forcing a dependency
on any third party libraries?

After a bit of reading LINKS I put this together:

```javascript

  /**
   * Manages custom events
   *
   * @class Event
   */
  var Event = {
    /** custom event cache */
    _cache: {},

    /**
     * Create an event by name.
     * Use fire unless you want to cache events ahead of time.
     * @param eventName
     */
    create: function(eventName) {
      var method;
      var self = this;

      if (document.createEvent) {
        method = function(eventName) {
          var event = document.createEvent('HTMLEvents');
          event.initEvent(eventName, true, true);
          return self.cache(eventName, event);
        };
      } else {
        // ie < 9
        method = function(eventName) {
          var event = document.createEventObject();
          event.eventType = eventName;
          return self.cache(eventName, event);
        };
      }

      self.create = method;
      return method(eventName);
    },

    /**
     * @private
     * @param eventName
     * @param event
     */
    cache: function(eventName, event) {
      event.eventName = eventName;
      this._cache[eventName] = event;
      return event;
    },

    /**
     * Get or create custom event of name
     * @param {string} name
     * @returns {object} custom event
     */
    get: function(eventName) {
      return this._cache[eventName] || this.create(eventName);
    },

    /**
     * Fire an event on an element by name
     * Lazily evaluates which fire event method is needed
     * @param el
     * @param eventName
     */
    fire: function(el, eventName) {
      var method;
      var self = this;

      if(document.createEvent) {
        method = function(el, eventName) {
          el.dispatchEvent(self.get(eventName));
        };
      } else {
        // ie < 9
        method = function(el, eventName) {
          var onEventName = ['on', eventName].join('');

          if(eventName !== 'input') {
            // Existing ie < 9 event name
            el.fireEvent(onEventName, self.get(eventName));
          } else if(el[onEventName]) {
            el[onEventName]();
          }
        };
      }

      self.fire = method;
      method(el, eventName);
    }
  };
```

`Event.fire` allows you to fire an event of any name on any element in ie >= 8,
and modern browsers. How convenient :)

Usage example:

```html
  <div id="target">Target</div>

  <script>
    var target = document.getElementById('target');

    target.addEventListener('click', function() {
      alert('target was clicked!');
    });

    Event.fire(target, 'click');
  </script>
```

