#!/bin/bash

bundle exec rake assets:precompile
bundle exec puma -b unix:///app/tmp/sockets/puma.sock

/usr/sbin/nginx

