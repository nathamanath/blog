threads 2,16
workers 2
preload_app!
daemonize
bind 'unix:///app/shared/tmp/sockets/puma.sock'

