title: Pre load images in javascript
date: 2015-05-09 19:00
tldr: Pre-loading images in javascript.

Pre loading images for your web applications gives the impression of loading faster, and
helps provide a smoother user experience. Here is a simple but effective solution to the problem:

```javascript
/**
 * @class Loader
 * @param path - image path
 * @param callback - called after image has loaded
 */
var Loader = function(path, callback) {
  this.path = path;
  this.callback = callback;
};

/** @lends @Loader */
Loader.prototype = {
  /** @returns Loader instance */
  load: function() {
    var image = this.image = new Image();
    image.onload = this.callback;
    image.src = this.path;

    return this;
  }
};

/**
 * Preload an array of image paths
 * @static
 * @param paths - array of paths
 * @param callback - called when batch has loaded
 */
Loader.batch = function(paths, callback) {
  var loaded = 0;

  var handleLoad = function() {
    loaded++;

    if (loaded === paths.length) {
      callback();
    }
  };

  for (var i = 0, l = paths.length; i < l; i++) {
    new Loader(paths[i], handleLoad).load();
  }
};
```

With this you can pre load individual images,

```javascript
var image = new Loader('path/to/image', function() { ... });
```

Or batches of images,

```javascript
Loader.batch(['paths', 'to', 'many', 'images'], function() { ... });
```

And have a callback executed when the image(s) is / are ready.

And [here](http://codepen.io/nathamanath/pen/MwwRrr) is a quick pen showing
it working!

