#!/bin/bash

# pull repo, build and run docker container, and update nginx config

OLD_CONTAINER_NAME=$(docker ps | grep ubuntu/blog:latest -m 1 | awk '{print $NF}')
OLD_IP=$(docker ps | grep ubuntu/blog:latest -m 1 | awk '{print $NF}' | xargs docker inspect --format '{{ .NetworkSettings.IPAddress }}')

# TODO: checkout code to working directory

# TODO: symlink shared paths... ./vendor/bundle

# bundle install --deployment --without development test -j 6 --path ./vendor/bundle

docker build -t ubuntu/blog .
docker run -d -t ubuntu/blog

NEW_IP=$(docker ps | grep ubuntu/blog:latest -m 1 | awk '{print $NF}' | xargs docker inspect --format '{{ .NetworkSettings.IPAddress }}')

# Update virtual host
sed -i "s/$OLD_IP/$NEW_IP/" ~/Projects/blog/config/docker/sites-available/test

# TODO: restart nginx

docker kill $OLD_CONTAINER_NAME

