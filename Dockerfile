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

ARG RUBY_VERSION
ARG RACK_ENV=production

ENV RUBY_VERSION=$RUBY_VERSION
ENV RACK_ENV=$RACK_ENV

ENV CONFIGURE_OPTS --disable-install-rdoc
RUN ruby-build ${RUBY_VERSION} /usr/local

# Tidy up
RUN apt-get purge -yq curl git-core
RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN mkdir -p /tmp/sockets

ENV GEM_HOME /var/blog/bundle
ENV PATH $GEM_HOME/bin:$PATH

RUN useradd -ms /bin/bash bloguser
RUN mkdir -p /var/blog/bundle
RUN mkdir -p /opt/blog
WORKDIR /opt/blog


COPY Gemfile /opt/blog
COPY Gemfile.lock /opt/blog

RUN chown -R bloguser /opt/blog
RUN chown -R bloguser /var/blog

USER bloguser
RUN gem install bundler
RUN bundle install --binstubs --without development test


USER root

COPY . /opt/blog
RUN chown -R bloguser /opt/blog

USER bloguser

RUN bundle exec rake assets:precompile

EXPOSE 9092

CMD bundle exec puma -C config/puma/docker.rb
