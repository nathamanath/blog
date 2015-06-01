FROM ubuntu/ruby_webapp
MAINTAINER NathanG

# Setup app
ADD ./config/docker/sites-available/default /etc/nginx/sites-available/default
ADD . /app
WORKDIR /app

RUN bundle install -j 8 --deployment --without development test

RUN mkdir -p tmp/sockets

ENTRYPOINT bin/startup.sh

