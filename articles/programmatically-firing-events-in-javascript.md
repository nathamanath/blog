title: Programmatically fire events in javascript
date: 2015-06-20 14:00

I have been working on a js replacement / polyfill for the native range input
as I need a consistent cross browser interface for this, and to be able to use
it in old ie. It works by generating an HTML facade, which can be easily styled
in many browsers, and as the user interacts with it, events are programmatically
fired on the actual input element.

One of the main problems to solve in this project was; how can you fire js
events programmatically in ie and browsers, without forcing a dependency
on any third party libraries?

After quite a bit of reading, I put this together (slightly modified to make
it more re-usable):

```javascript
  /**
   * Manages custom events
   *
   * @class Event
   * @private
   */
  var Event = {
    /**
     * Lazily evaluates which create method needed
     * @param eventName
     * @param [eventType=HTMLEvents] - type of event
     */
    create: function(eventName, eventType) {
      var method;
      var self = this;

      eventType = eventType || 'HTMLEvents';

      if (document.createEvent) {
        method = function(eventName) {
          var event = document.createEvent(eventType);

          // dont bubble
          event.initEvent(eventName, false, true);

          return event;
        };
      } else {
        // ie < 9
        // BUGFIX: Infinite loop on keypress in ie8
        // will update when i fix this
        method = function(eventName, eventType) {
          var _event = document.createEventObject(
            window.event
          );

          _event.cancelBubble = true;
          _event.eventType = eventName;
          return _event;
        };
      }

      self.create = method;
      return method(eventName);
    },

    /**
     * Lazily evaluates which fire event method is needed
     * @param el
     * @param eventName
     */
    fire: function(el, eventName, eventType, code) {
      var method;
      var self = this;

      if(document.createEvent) {
        method = function(el, eventName, eventType, code) {
          var event = self.create(eventName, eventType);

          if(eventType === 'KeyboardEvent') {
            var get = { get: function() { return code } };
            var defineProperty = Object.defineProperty;

            defineProperty(event, 'which', get);
            defineProperty(event, 'keyCode', get);
          }

          el.dispatchEvent(event);
        };
      } else {
        // ie < 9
        method = function(el, eventName, eventType, code) {
          var onEventName = ['on', eventName].join('');

          // Event names recognised by old ie
          // (without the 'on').
          // any event not in this list must be
          // handled differently in ie < 9
          var ieEvents = [
            'load',
            'unload',
            'blur',
            'change',
            'focus',
            'reset',
            'select',
            'submit',
            'abort',
            'keydown',
            'keypress',
            'keyup',
            'click',
            'dblclick',
            'mousedown',
            'mousemove',
            'mouseout',
            'mouseover',
            'mouseup'
          ];

          // no indexOf in old ie
          var isIeEvent = function(event) {
            for(var i = 0, l = ieEvents.length; i < l; i++) {
              if(ieEvents[i] === event) {
                return true;
              }
            }

            return false;
          };

          if(isIeEvent(eventName)) {
            // Existing ie < 9 event name
            var _event = self.create(eventName);

            _event.keyCode = code;

            el.fireEvent(onEventName, _event);
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

Non standard ie < 9 events (events not listed in `ieEvents` above) must be bound
like so in order to work in ie <= 8.

```javascript
  el.onstrangeevent = function() { ... };
```

I would handle this by adding a method above for adding event listeners to
elements.

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

And [here it is](http://codepen.io/nathamanath/pen/GopVOX) working on codepen.
