DOCKER_REPO:=gallery.ecr.aws
DOCKER_IMAGE:=agilesyndrome/syndrome-magick-base
AWS_ACCOUNT_ID:=$(shell aws sts get-caller-identity | jq -r '.Account')
AWS_REGION:=us-east-2
BUILD_CACHE=$(shell cat .build_cache)
GIT_SHA:=$(shell git rev-parse HEAD)

LIBPNG_VERSION:=1.6.37
IMAGEMAGICK_VERSION:=7.1.0-13
LIBHEIF_VERSION:=1.12.0
LIBDE265_VERSION:=1.0.8
GRAPHICSMAGIC_VERSION:=1.3.36

build: cache
	aws ecr-public get-login-password --region us-east-1 | docker login --username AWS --password-stdin public.ecr.aws
	docker build --build-arg CACHE_KEY=$(BUILD_CACHE) -t $(DOCKER_IMAGE) -f Dockerfile .

clean:
	rm -rf ./cache
	@echo "This will prune all Docker images and caches on this system... not just ones related to this project"
	docker system prune -a

./cache/libheif-%:
	@echo "Caching $@"
	@mkdir -p ./cache
	curl -L -o ./cache/libheif-$*.tar.gz https://github.com/strukturag/libheif/releases/download/v$*/libheif-$*.tar.gz
	@tar -xzvf ./cache/libheif-$*.tar.gz -C ./cache

./cache/libde265-%:
	@echo "Caching $@"
	@mkdir -p ./cache
	curl -L -o ./cache/libde265-$*.tar.gz https://github.com/strukturag/libde265/releases/download/v$*/libde265-$*.tar.gz
	@tar -xzvf ./cache/libde265-$*.tar.gz -C ./cache

./cache/libpng-%:
	@echo "Caching $@"
	@mkdir -p ./cache
	curl -L -o ./cache/libpng-$*.tar.xz https://sourceforge.net/projects/libpng/files/libpng16/$*/libpng-$*.tar.xz/download
	@tar -xzvf ./cache/libpng-$*.tar.xz -C ./cache

./cache/ImageMagick-%:
	@echo "Caching $@"
	@mkdir -p ./cache
	curl -L -o ./cache/ImageMagick-$*.tar.xz https://download.imagemagick.org/ImageMagick/download/ImageMagick-$*.tar.xz
	@tar -xzvf ./cache/ImageMagick-$*.tar.xz -C ./cache

./cache/GraphicsMagick-%:
	@echo "Caching $@"
	@mkdir -p ./cache
	curl -L -o ./cache/GraphicsMagick-$*.tar.xz https://sourceforge.net/projects/graphicsmagick/files/graphicsmagick/$*/GraphicsMagick-$*.tar.xz/download
	@tar -xzvf ./cache/GraphicsMagick-$*.tar.xz -C ./cache

./cache/aws:
	@echo "Caching AWS"
	@mkdir -p ./cache
	curl -L -o ./cache/awscli-exe-linux-x86_64.zip https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip
	unzip ./cache/awscli-exe-linux-x86_64.zip -d ./cache

cache:
	@make ./cache/libpng-$(LIBPNG_VERSION)
	@make ./cache/ImageMagick-$(IMAGEMAGICK_VERSION)
	@make ./cache/aws
	@make ./cache/libheif-$(LIBHEIF_VERSION)
	@make ./cache/libde265-$(LIBDE265_VERSION)
	@make ./cache/GraphicsMagick-$(GRAPHICSMAGIC_VERSION)

	# Save Cache
	aws s3 sync ./cache s3://artifacts.agilesyndrome.private/syndrome-magick --exclude '*' --include '*.tar.gz' --include '*.zip' --include '*.xz' --exclude 'aws/*'

shell:
	docker run \
		-e AWS_ACCESS_KEY_ID \
		-e AWS_SECRET_ACCESS_KEY \
		-e AWS_REGION \
		-e IMAGE_SET_FORMAT=JPEG \
		-v $(PWD)/tests:/tests \
		-v $(PWD)/src:/var/task \
		-it --entrypoint bash $(DOCKER_IMAGE)

publish:
	aws ecr-public get-login-password --region us-east-1 | docker login --username AWS --password-stdin public.ecr.aws
	docker tag $(DOCKER_IMAGE) public.ecr.aws/$(DOCKER_IMAGE):latest
	docker push public.ecr.aws/$(DOCKER_IMAGE)

publish-dev:
	aws ecr get-login-password --region $(AWS_REGION) | docker login --username AWS --password-stdin $(AWS_ACCOUNT_ID).dkr.ecr.$(AWS_REGION).amazonaws.com
	docker tag $(DOCKER_IMAGE) $(AWS_ACCOUNT_ID).dkr.ecr.$(AWS_REGION).amazonaws.com/$(DOCKER_IMAGE):$(shell git rev-parse --abbrev-ref HEAD)
	docker push $(AWS_ACCOUNT_ID).dkr.ecr.$(AWS_REGION).amazonaws.com/$(DOCKER_IMAGE):$(shell git rev-parse --abbrev-ref HEAD)

.PHONY: cache
