FROM dockerfile/ubuntu
MAINTAINER NathanG

# Update
RUN apt-get update -yqq

# Install ruby-build
RUN apt-get install -yqq git-core && apt-get clean
RUN git clone https://github.com/sstephenson/ruby-build.git && cd ruby-build && ./install.sh

# Install ruby 2.1.2
RUN apt-get install -yqq libssl-dev
ENV CONFIGURE_OPTS --disable-install-rdoc
RUN ruby-build 2.1.2 /usr/local
RUN gem install bundler

# Install nginx + setup
RUN apt-get install -yqq nginx
RUN echo "daemon off;" >> /etc/nginx/nginx.conf

# Mount our app
VOLUME ./ /app

# configure nginx

# start app

# expose port 80
EXPOSE 80

ENTRYPOINT /usr/sbin/nginx

