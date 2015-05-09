#!/bin/bash

# slurp!
cat .env | grep -v '#' | while read line; do
  export $line
done

bundle exec puma -d -e production -b unix:///app/tmp/sockets/blog.sock

/usr/sbin/nginx

