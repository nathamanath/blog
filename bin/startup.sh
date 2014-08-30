#!/bin/bash

bundle exec puma -d -e production -b unix:/app/tmp/sockets/blog.sock

/usr/sbin/nginx

