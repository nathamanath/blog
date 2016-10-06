FROM ubuntu

RUN apt-get update -yqq && apt-get upgrade -yqq

# Ruby
RUN apt-get -yqq update
RUN apt-get -yqq install git-core curl zlib1g-dev build-essential libssl-dev libreadline-dev libyaml-dev libxml2-dev libxslt1-dev libcurl4-openssl-dev python-software-properties libffi-dev
RUN apt-get clean

RUN git clone https://github.com/sstephenson/ruby-build.git && cd ruby-build && ./install.sh

ENV CONFIGURE_OPTS --disable-install-rdoc
RUN ruby-build 2.3.1 /usr/local
RUN rm -r ruby-build

# should be linked to gems conatainer so that gems can persist
# between deployments.
ENV GEM_HOME /ruby_gems/2.3
ENV PATH /ruby_gems/2.3/bin:$PATH

# Nginx
RUN apt-get install -yqq nginx --fix-missing
RUN echo "daemon off;" >> /etc/nginx/nginx.conf
ADD ./config/docker/sites-available/default /etc/nginx/sites-available/default

RUN mkdir -p /tmp/sockets

WORKDIR /app

EXPOSE 80

ENTRYPOINT server/config/docker/startup.sh
