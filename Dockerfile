FROM debian:stretch

# Ruby
RUN apt-get -yq update && apt-get -yq install \
  git-core \
  curl \
  zlib1g-dev \
  build-essential \
  libssl-dev \
  libreadline-dev \
  libyaml-dev \
  libxml2-dev \
  libxslt1-dev \
  libcurl4-openssl-dev \
  software-properties-common \
  libffi-dev

RUN git clone https://github.com/sstephenson/ruby-build.git
WORKDIR ruby-build
RUN ./install.sh

ARG RUBY_VERSION=2.4.3
ENV RUBY_VERSION=$RUBY_VERSION

ENV CONFIGURE_OPTS --disable-install-rdoc
RUN ruby-build 2.4.3 /usr/local

# Tidy up
RUN apt-get purge -yq curl git-core
RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Should be linked to gems volume
ENV GEM_HOME /usr/local/bundle
ENV PATH $GEM_HOME/bin:$PATH
VOLUME /usr/local/bundle

RUN mkdir -p /tmp/sockets

RUN useradd -ms /bin/bash bloguser
RUN mkdir /opt/blog
COPY . /opt/blog
RUN chown -R bloguser /opt/blog

USER bloguser
WORKDIR /home/bloguser

EXPOSE 9092

ENTRYPOINT /bin/startup.sh
