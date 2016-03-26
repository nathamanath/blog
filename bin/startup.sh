#!/bin/bash

gem install bundler
bundle install --path /ruby_gems/2.2 -j 8 --binstubs --without development test

RACK_ENV=production bundle exec rake assets:precompile
RACK_ENV=production bundle exec puma -b unix:///app/tmp/sockets/puma.sock -e production

/usr/sbin/nginx

