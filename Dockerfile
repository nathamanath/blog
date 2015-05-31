FROM ubuntu
MAINTAINER NathanG

RUN apt-get update -yqq && apt-get upgrade -yqq

# Ruby
RUN apt-get install -yqq git-core curl zlib1g-dev build-essential libssl-dev libreadline-dev libyaml-dev libsqlite3-dev sqlite3 libxml2-dev libxslt1-dev libcurl4-openssl-dev python-software-properties libffi-dev && apt-get clean
RUN git clone https://github.com/sstephenson/ruby-build.git && cd ruby-build && ./install.sh
ENV CONFIGURE_OPTS --disable-install-rdoc
RUN ruby-build 2.2.2 /usr/local
RUN rm -r ruby-build
RUN gem install bundler

# Nginx
RUN apt-get install -yqq nginx
RUN echo "daemon off;" >> /etc/nginx/nginx.conf
ADD ./config/docker/sites-available/default /etc/nginx/sites-available/default
EXPOSE 80

# Memcache
RUN apt-get install -yqq memcached

# Setup app
ADD . /app
WORKDIR /app

RUN mkdir -p tmp/sockets

ENTRYPOINT bin/startup.sh

