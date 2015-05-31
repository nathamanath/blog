#!/bin/bash

# Run on server with sudo.
# Update virtual host file, and restart nginx

sudo sed -i "s/^        server .*/        server $1;/" /etc/nginx/sites-available/blog.nathansplace.co.uk
sudo service nginx restart

