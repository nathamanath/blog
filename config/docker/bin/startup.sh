#!/bin/bash

# Called on entrypoint.

# su -c 'cd /app/current && ./bin/startup.sh' - git

/usr/sbin/sshd -D &
/usr/sbin/nginx

