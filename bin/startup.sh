#!/bin/bash

# Start / restart app

bundle exec rake assets:precompile

bundle exec puma

