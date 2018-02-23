REGISTRY_NAME=$(shell cat ./registry.txt)
IMAGE_NAME=nathamanath/blog
VERSION=$(shell cat ./version.txt)
ENVIRONMENT=production

release: build docker push

install:
	cd ./ui && npm install

build:
	cp ./static/* ./public/
	cd ./ui && npm run prod

docker:
	docker build --build-arg RUBY_VERSION=2.4.3 --build-arg RACK_ENV=${ENVIRONMENT} -t ${IMAGE_NAME} .
	docker tag  ${IMAGE_NAME} ${REGISTRY_NAME}/${IMAGE_NAME}:latest
	docker tag  ${IMAGE_NAME} ${REGISTRY_NAME}/${IMAGE_NAME}:${VERSION}

push:
	docker push ${REGISTRY_NAME}/${IMAGE_NAME}:latest
	docker push ${REGISTRY_NAME}/${IMAGE_NAME}:${VERSION}

PHONY: docker build
