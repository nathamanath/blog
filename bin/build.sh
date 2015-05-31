#!/bin/bash

# pull repo, build and run docker container, and update nginx config

OLD_CONTAINER_NAME=$(docker ps | grep ubuntu/blog:latest -m 1 | awk '{print $NF}')

OLD_IP=$(docker ps | grep ubuntu/blog:latest -m 1 | awk '{print $NF}' | xargs docker inspect --format '{{ .NetworkSettings.IPAddress }}')

git fetch
git rebase origin master

docker build -t ubuntu/blog .
docker run -d -t ubuntu/blog

NEW_IP=$(docker ps | grep ubuntu/blog:latest -m 1 | awk '{print $NF}' | xargs docker inspect --format '{{ .NetworkSettings.IPAddress }}')

# TODO: update virtual host file
sed -i "s/$OLD_IP/$NEW_IP/" ~/Projects/blog/config/docker/sites-available/test
# TODO: restart nginx
docker kill $OLD_CONTAINER_NAME

echo $NEW_IP

