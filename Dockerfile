FROM dockerfile/ubuntu
MAINTAINER NathanG

RUN apt-get update -yqq

# Install ruby 2.1.2
RUN apt-get install -yqq git-core && apt-get clean
RUN git clone https://github.com/sstephenson/ruby-build.git && cd ruby-build && ./install.sh
RUN apt-get install -yqq libssl-dev
ENV CONFIGURE_OPTS --disable-install-rdoc
RUN ruby-build 2.1.2 /usr/local
RUN rm -r ruby-build

# Install nginx + setup
RUN apt-get install -yqq nginx
RUN echo "daemon off;" >> /etc/nginx/nginx.conf
ADD ./config/sites-available/default /etc/nginx/sites-available/default

# TODO: change this to git clone
ADD . /app
WORKDIR /app
RUN mkdir -p /app/tmp/sockets

EXPOSE 80

# ENTRYPOINT ./bin/startup.sh

