export const dgid = (id) => {
  return document.getElementById(id)
}

export const $ = (selector, scope) => {
  scope = scope || document;
  return scope.querySelector(selector);
}

/** @returns Array of matching nodes */
export const $$ = (selector, scope) => {
  scope = scope || document;
  return Array.prototype.slice.call(scope.querySelectorAll(selector));
}

/**
 * @param fn - function to be throttled
 * @param threshhold - min time in ms between calls to fn
 * @param scope - scope in which fn is executed
 * @returns throttled version of function
 */
export const throttle = function(fn, threshhold, scope) {
  threshhold = threshhold || 300;

  let last;
  let deferTimer;

  return function() {
    let context = scope || this;
    let now = (new Date()).getTime();
    let args = arguments;

    if(last && now < last + threshhold) {
      clearTimeout(deferTimer);

      deferTimer = setTimeout(function () {
        last = now;
        fn.apply(context, args);
      }, threshhold);

    } else {
      last = now;
      fn.apply(context, args);
    }
  }
}
