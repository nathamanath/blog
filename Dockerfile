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

# mysql
RUN apt-get install -yqq libmysqlclient-dev

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

# SSH key for login
ADD config/docker/id_rsa.pub /root/.ssh/id_rsa.pub
RUN cat /root/.ssh/id_rsa.pub >> /root/.ssh/authorized_keys

# Deploy key for app
ADD config/docker/id_rsa_deploy /root/.ssh/id_rsa_deploy
RUN  echo "    IdentityFile ~/.ssh/id_rsa_deploy" >> /etc/ssh/ssh_config

# Add bitbucket to known hosts so we can connect later with no fuss
ADD ./config/docker/known_hosts /root/.ssh/known_hosts

RUN mkdir -p /app/shared/config
RUN mkdir -p /app/tmp/sockets
ADD ./config/database.yml /app/shared/config/database.yml
WORKDIR /app

ADD bin /app/bin
ENTRYPOINT ./bin/startup.sh

