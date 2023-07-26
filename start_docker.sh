#!/bin/bash

# Stop and remove the existing container (if running)
docker stop ecommerce-site
docker rm ecommerce-site

# Run the Docker container with a mounted volume
docker build -t ecommerce-site .
docker run -it --name ecommerce-site -p 8080:8080 -p 8081:8081 ecommerce-site