IMAGE_NAME=nathamanath/blog
VERSION=$(shell cat ./version.txt)

docker:
	docker build --build-arg RUBY_VERSION=2.4.3 -t ${IMAGE_NAME} .
	docker tag  ${IMAGE_NAME} ${IMAGE_NAME}:latest
	docker tag  ${IMAGE_NAME} ${IMAGE_NAME}:${VERSION}

PHONY: docker
