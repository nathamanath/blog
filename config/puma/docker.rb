threads 0,8
workers 2 # Should match number of cores
preload_app!
environment 'production'
bind 'unix:///tmp/sockets/app.sock'
