IMAGE_NAME=nathamanath/blog
VERSION=$(shell cat ./version.txt)
ENVIRONMENT=production

docker:
	docker build --build-arg RUBY_VERSION=2.4.3 --build-arg RACK_ENV=${ENVIRONMENT} -t ${IMAGE_NAME} .
	docker tag  ${IMAGE_NAME} ${IMAGE_NAME}:latest
	docker tag  ${IMAGE_NAME} ${IMAGE_NAME}:${VERSION}

PHONY: docker
