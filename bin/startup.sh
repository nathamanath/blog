#!/bin/bash

# Start / restart app
# TODO: Start app on docker ENTRYPOINT. Use this to restart.

bundle install -j8 --deployment --binstubs --without development test --path /app/shared/vendor/bundle
bundle exec rake assets:precompile

# pumactl and sending SIGUSR2 dont do the job, so kill puma dead
ps ax | grep puma | awk '{print $1}' | xargs kill -6
bundle exec puma

