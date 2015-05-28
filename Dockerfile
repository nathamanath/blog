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

# SSH
RUN mkdir ~/.ssh
RUN sudo apt-get install -yqq openssh-server
RUN mkdir /var/run/sshd
# SSH login fix. Otherwise user is kicked off after login
RUN sed 's@session\s*required\s*pam_loginuid.so@session optional pam_loginuid.so@g' -i /etc/pam.d/sshd
ENV NOTVISIBLE "in users profile"
RUN echo "export VISIBLE=now" >> /etc/profile
RUN echo "export SSH_AUTH_SOCK=$SSH_AUTH_SOCK" >> /etc/profile
RUN sed -i 's/PermitRootLogin without-password/PermitRootLogin yes/' /etc/ssh/sshd_config
RUN echo "PasswordAuthentication no" >> /etc/ssh/sshd_config
EXPOSE 22

# git
RUN apt-get install -yqq git-core
RUN useradd --group sudo -ms /bin/bash git
USER git
WORKDIR /home/git
RUN mkdir .ssh && chmod 700 .ssh
RUN touch .ssh/authorized_keys && chmod 600 .ssh/authorized_keys
RUN mkdir blog.git
RUN git init --bare blog.git
ADD config/docker/git/hooks/post-receive blog.git/hooks/post-receive

# SSH key for git user login
ADD config/docker/id_rsa.pub .ssh/id_rsa.pub
RUN cat .ssh/id_rsa.pub >> .ssh/authorized_keys

# Setup app
USER root

RUN mkdir /app
WORKDIR /app

RUN mkdir -p shared/vendor/bundle
RUN mkdir -p shared/tmp/sockets
ADD . current

RUN chown -R git /app
RUN chown -R git /home/git

ENTRYPOINT /app/current/config/docker/bin/startup.sh

