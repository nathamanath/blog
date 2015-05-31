#!/bin/bash

bundle exec rake assets:precompile
bundle exec puma -b unix:///app/current/tmp/sockets/puma.sock

/usr/sbin/nginx

