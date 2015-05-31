#!/bin/bash

# Update virtual host file, and restart nginx

sudo sed -i "s/^        server .*/        server $1;/" /etc/nginx/sites-available/test
sudo service nginx restart

