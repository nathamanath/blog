#!/bin/bash

gem install bundler
bundle install -j8 --deployment --binstubs --without development test
bundle exec puma -d -e production -b unix:/app/tmp/sockets/blog.sock

/usr/sbin/nginx

