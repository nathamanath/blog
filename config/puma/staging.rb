threads 0,1
workers 1 # Should match number of cores
daemonize
preload_app!
environment 'staging'
bind 'unix:///tmp/sockets/app.sock'
