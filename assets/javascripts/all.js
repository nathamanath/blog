/*global TimeAgo*/
(function(){"use strict";!function(t){var n=[{name:"second",time:3e4,fn:function(t){return Math.abs(t)/1e3}},{name:"minute",time:45e3,fn:function(t){return n[0].fn(t)/60}},{name:"hour",time:6e5,fn:function(t){return n[1].fn(t)/60}},{name:"day",fn:function(t){return n[2].fn(t)/24}},{name:"week",fn:function(t){return n[3].fn(t)/7}},{name:"month",fn:function(t){return n[4].fn(t)/30}},{name:"year",fn:function(t){return n[5].fn(t)/12}}],e=function(t){return this.el=t,this.date=this._parseTime(),this.update(),this};e.prototype={_getDifference:function(){return new Date-this.date},_getTime:function(){return this.el.getAttribute("data-time")},_parseTime:function(){var t,n=this._getTime();return new Date((t=1*n)?t:n)},_calculateMeasure:function(){for(var t,e=n[0],i=0;i<n.length;i++){var r,u=n[i];if(r=u.fn(this.difference),1>r)return this.measure=t,void(this.unit=e);e=u,t=r}},_setTimeout:function(){var t=this.unit.time,n=this;t&&(this._timeout=setTimeout(function(){n.update()},t))},_measureString:function(){var t,n=this.measure;return t=2>n?"hour"===this.unit.name?"an":"a":String(Math.floor(n))},_longOutput:function(){var t,n=null,e=this.measure,i=Math.floor(e);return i!==e&&(n="about"),t=this.unit.name,e>=2&&(t+="s"),[n,this._measureString(),t,"ago"].join(" ")},_shortOutput:function(){return"less than a minute ago"},_isSeconds:function(){return this.unit!==n[0]},_outputString:function(){return this._isSeconds()?this._longOutput():this._shortOutput()},update:function(){this.difference=this._getDifference(),this._calculateMeasure(),this.el.innerHTML=this._outputString(),this._setTimeout()}},e.init=function(t){var n=[];if(!t instanceof Array)throw new Error("TimeAgo.init requires els");for(var i=0;i<t.length;i++){var r=t[i];n.push(e["new"](r))}return n},e["new"]=function(t){if("undefined"==typeof t)throw new Error("TimeAgo.new requires el");return new e(t)};var i=t.define||null;"function"==typeof i&&i.amd?i("time_ago",[],function(){return e}):t.TimeAgo=e}(window)}).call(this);

(function(){
  'use strict';

  var els = document.querySelectorAll('time');
  TimeAgo.init(els);
})();

