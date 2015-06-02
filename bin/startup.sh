#!/bin/bash

bundle install --path /ruby_gems/2.2 -j 8 --binstubs --without development test

bundle exec rake assets:precompile
bundle exec puma -b unix:///app/tmp/sockets/puma.sock

/usr/sbin/nginx

