FROM dockerfile/ubuntu
MAINTAINER NathanG

RUN apt-get update -yqq && apt-get upgrade -yqq

# Ruby
RUN apt-get install -yqq git-core libffi-dev && apt-get clean
RUN git clone https://github.com/sstephenson/ruby-build.git && cd ruby-build && ./install.sh
RUN apt-get install -yqq libssl-dev
ENV CONFIGURE_OPTS --disable-install-rdoc
RUN ruby-build 2.2.0 /usr/local
RUN rm -r ruby-build
RUN gem install bundler

# Memcached
RUN apt-get install -yqq memcached

# Nginx
RUN apt-get install -yqq nginx
RUN echo "daemon off;" >> /etc/nginx/nginx.conf
ADD ./config/docker/sites-available/default /etc/nginx/sites-available/default
EXPOSE 80

# SSH
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
ADD config/docker/id_rsa_blog_deploy /root/.ssh/id_rsa_blog_deploy
RUN  echo "    IdentityFile ~/.ssh/id_rsa_blog_deploy" >> /etc/ssh/ssh_config

# Add github to known hosts so we can connect later with no fuss
RUN ssh-keyscan -t rsa,dsa github.com >> ~/.ssh/known_hosts

RUN mkdir /app

ENTRYPOINT ./bin/startup.sh

