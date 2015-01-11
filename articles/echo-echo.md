title: Echo... echo
date: 2015-01-12 12:00

Recently I have been developing a javascript heavy application whos
purpose is to present data provided by a REST API which does not yet exist.

To help with this and to enable me to demonstrate the app working, I spent a
couple of hours putting together a service which will respond to my http
requests in whatever way I like. [Check it out](http://echo.nathansplace.co.uk)

I have been finding this app rather useful, so I thought I would share.

By default echo will respond successfully with an empty response body, but by
setting request params as json or url params you can control response status,
body and headers. There are examples on the apps home page to get you started.

It is a sinatra based app, and when putting it together, I took the chance to
try out minitest over rspec which is my usual choice when testing ruby apps.
I wanted to use minitest as it is a lighter, and should run faster. It was
interesting trying another solution to the same problem, and worked great.
I will be using rspec again to test my next ruby project, as it is what I am
used tom and therefore I can write tests quickly and focus on the project I am
working on. But will defiantly make a point of trying out minitest again soon.

The other interesting part was setting up cors headers in sinatra which I have
not needed to do before. This was pleasingly simple to do, and can be seen [on github](https://github.com/nathamanath/echo/blob/master/app.rb)

The source is on [github](https://github.com/nathamanath/echo), and the app
itself is hosted here: http://echo.nathansplace.co.uk. It comes with a docker
file so you can easily run your own version locally :)

