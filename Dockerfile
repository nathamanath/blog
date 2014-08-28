FROM dockerfile/ubuntu
MAINTAINER NathanG

RUN apt-get update -yqq

# Install ruby-build
RUN apt-get install -yqq git-core && apt-get clean
RUN git clone https://github.com/sstephenson/ruby-build.git && cd ruby-build && ./install.sh

# Install ruby 2.1.2 + bundler
RUN apt-get install -yqq libssl-dev
ENV CONFIGURE_OPTS --disable-install-rdoc
RUN ruby-build 2.1.2 /usr/local
RUN gem install bundler

# clean up ruby build

# Install nginx + setup
RUN apt-get install -yqq nginx
RUN echo "daemon off;" >> /etc/nginx/nginx.conf
# configure nginx

VOLUME ./ /app
WORKDIR /app

RUN bundle install -j8 --deployment

# configure puma and start

# start app
RUN bundle exec rackup config.ru

EXPOSE 80

ENTRYPOINT /usr/sbin/nginx

