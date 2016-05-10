#!/bin/bash

gem install bundler
bundle install --binstubs --without development test

RACK_ENV=production bundle exec rake assets:precompile
RACK_ENV=production bundle exec puma -e production

/usr/sbin/nginx
