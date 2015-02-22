FROM dockerfile/ubuntu
MAINTAINER NathanG

RUN apt-get update -yqq && apt-get upgrade -yqq

# Ruby
RUN apt-get install -yqq git-core && apt-get clean
RUN git clone https://github.com/sstephenson/ruby-build.git && cd ruby-build && ./install.sh
RUN apt-get install -yqq libssl-dev
ENV CONFIGURE_OPTS --disable-install-rdoc
RUN ruby-build 2.2.0 /usr/local
RUN rm -r ruby-build

# Memcached
RUN apt-get install -yqq memcached

# Nginx
RUN apt-get install -yqq nginx
RUN echo "daemon off;" >> /etc/nginx/nginx.conf
ADD ./config/sites-available/default /etc/nginx/sites-available/default

# Add just Gemfile and bundle to make this cachable
ADD Gemfile /app/Gemfile
ADD Gemfile.lock /app/Gemfile.lock
WORKDIR /app
RUN gem install bundler
RUN bundle install -j8 --deployment --binstubs --without development test

ADD . /app
WORKDIR /app
RUN mkdir -p tmp/sockets

RUN RACK_ENV=production bundle exec rake css

EXPOSE 80

ENTRYPOINT ./bin/startup.sh

