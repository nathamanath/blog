/*global TimeAgo*/
!function(){"use strict";var t=[{name:"second",time:1e3,fn:function(t){return Math.abs(t)/1e3}},{name:"minute",time:3e4,fn:function(e){return t[0].fn(e)/60}},{name:"hour",time:6e5,fn:function(e){return t[1].fn(e)/60}},{name:"day",fn:function(e){return t[2].fn(e)/24}},{name:"week",fn:function(e){return t[3].fn(e)/7}},{name:"month",fn:function(e){return t[4].fn(e)/30}},{name:"year",fn:function(e){return t[5].fn(e)/12}}],e=new Date,n=function(t){return this.el=t,this.date=this._parseTime(),this.update(),this};n.prototype={_getDifference:function(){return e-this.date},_getTime:function(){return this.el.getAttribute("data-time")},_parseTime:function(){return new Date(1*this._getTime())},_calculateMeasure:function(){for(var e,n=t[0],i=0;i<t.length;i++){var u,r=t[i];if(u=r.fn(this.difference),1>u)return this.measure=e,void(this.unit=n);n=r,e=u}},_setTimeout:function(){var t=this.unit.time,e=this;t&&(this._timeout=setTimeout(function(){e.update()},t))},update:function(){if(e=new Date,this.difference=this._getDifference(),this._calculateMeasure(),this.unit!==t[0].name){var n,i,u,r=Math.floor(this.measure);r!==this.measure&&(n="about "),i=this.measure<2?"hour"===this.unit.name?"an":"a":r,u=this.unit.name,this.measure>=2&&(u+="s"),this.output=n+i+" "+u+" ago"}else this.output="less than a minute ago";this.el.innerHTML=this.output,this._setTimeout()}},n.init=function(t){for(var e=document.querySelectorAll(t),i=[],u=0;u<e.length;u++){var r=e[u];i.push(new n(r))}return i},window.TimeAgo=n}();

(function(){
  'use strict';
  TimeAgo.init('time');
})();

