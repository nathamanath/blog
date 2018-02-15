/**
 * @fileOverview Time ago in words in js but without jquery.
 * @author NathanG
 * @version 0.1.0
 */




    /**
     * Units of time required by TimeAgo
     * @private
     * @type array
     */
    var UNITS = [
      { name: 'second', time: 30000,
        fn: function(ms) { return Math.abs(ms) / 1000; } },
      { name: 'minute', time: 45000,
        fn: function(ms) { return UNITS[0].fn(ms) / 60; } },
      { name: 'hour', time: 600000,
        fn: function(ms) { return UNITS[1].fn(ms) / 60; } },
      { name: 'day', fn: function(ms) { return UNITS[2].fn(ms) / 24; } },
      { name: 'week', fn: function(ms) { return UNITS[3].fn(ms) / 7; } },
      { name: 'month', fn: function(ms) { return UNITS[4].fn(ms) / 4; } },
      { name: 'year', fn: function(ms) { return UNITS[5].fn(ms) / 12; } }
    ];

    /**
     * Represents a time ago instance
     *
     * @param {object} el - Dom node. Should be time element with data-time
     * attribute set
     * @class TimeAgo
     */
    var TimeAgo = function(el, time) {
      this.el = el;
      this.time = time;
      this.date = this._parseTime();

      this.update();

      return this;
    };

    /** @memberof TimeAgo */
    TimeAgo.prototype = {

      /**
       * diff current time and el time
       * @private
       * @returns {number}
       */
      _getDifference: function() {
        return new Date() - this.date;
      },

      /**
       * Get time to diff from this.el
       * @private
       * @returns {string}
       */
      _getTime: function() {
        return this.time || this.el.getAttribute('data-time');
      },

      /**
       * Parse el time to date instance. Handle string of date or UTC
       * @private
       * @returns Date instance
       */
      _parseTime: function() {
        var time = this._getTime(),
            t;

        return new Date((!!(t = time * 1)) ? t : time);
      },

      /**
       * Work out measure of time we are counting time in... how many of which
       * unit. Set this.unit, aswell as this.measure
       *
       * @private
       */
      _calculateMeasure: function() {
        var lastMeasure;
        var lastUnit = UNITS[0];

        var i = 0;
        var unit;
        var measure;

        while(unit = UNITS[i]) {
          measure = unit.fn(this.difference);

          if(measure < 1) {
            this.measure = lastMeasure;
            this.unit = lastUnit;
            return;
          }

          lastUnit = unit;
          lastMeasure = measure;

          i++;
        }

        // if we get to last unit
        this.measure = lastMeasure;
        this.unit = lastUnit;
      },

      /**
       * Set timeout for next update of instance. This is declared in unit.time
       * if unit.time is falsy, then no live updates happen for unit.
       *
       * @private
       */
      _setTimeout: function() {
        var time = this.unit.time,
            that = this;

        if(!time) { return; }

        this._timeout = setTimeout(function() {
          that.update();
        }, time);
      },

      /**
       * Either a count of unit, or words
       *
       * @private
       * @returns {string}
       */
      _measureString: function() {
        var out,
            measure = this.measure;

        if(measure < 2) {
          out = (this.unit.name === 'hour') ? 'an' : 'a';
        }else{
          out = String(Math.floor(measure));
        }

        return out;
      },

      /**
       * Output when a long amount of time has passed. i.e. not seconds.
       * @private
       * @returns {string} time ago in words
       */
      _longOutput: function() {
        var prefix = null;
        var measure = this.measure;
        var measureFloor = Math.floor(measure);
        var unitString = this.unit.name;

        if(measureFloor !== measure) {
          prefix = 'about';
        }

        if(measure >= 2) {
          unitString += 's';
        }

        var out = [this._measureString(), unitString, 'ago'];

        if(prefix) {
          out.unshift(prefix);
        }

        return out.join(' ');
      },

      /**
       * Output for when less than a minute has passed.
       * @private
       * @retuens {string}
       */
      _shortOutput: function() {
        return 'less than a minute ago';
      },

      /**
       * Is time diff in seconds?
       * @private
       * @returns {boolean}
       */
      _isSeconds: function() {
        return (this.unit !== UNITS[0]);
      },

      /**
       * @private
       * @returns {string}
       */
      _outputString: function() {
        return (this._isSeconds()) ? this._longOutput() : this._shortOutput();
      },

      /**
       * update diff and update dom
       */
      update: function() {
        this.difference = this._getDifference();
        this._calculateMeasure();

        this.el.innerHTML = this._outputString();
        this._setTimeout();
      },

      destroy: function() {
        // remove timeouts
        clearTimeout(this._timeout);
      }
    };

    /**
     * Kick off TimeAgo for 1 or more dom nodes
     *
     * @param {array} els - array of dom nodes, see TimeAgo
     */
    TimeAgo.init = function(els) {
      var times = [];

      if(!els instanceof Array) {
        throw(new Error('TimeAgo.init requires els'));
      }

      for(var i = 0; i < els.length; i++) {
        var el = els[i];

        times.push(TimeAgo.new(el));
      }

      return times;
    };

    /**
     * New Timeago instance
     *
     * @param {object} el - see TimeAgo
     * @returs TimeAgo instance
     */
    TimeAgo.new = function(el) {
      if(typeof el === 'undefined') {
        throw(new Error('TimeAgo.new requires el'));
      }

      return new TimeAgo(el);
    };

    export default TimeAgo

