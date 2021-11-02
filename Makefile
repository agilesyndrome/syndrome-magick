DOCKER_REPO:=gallery.ecr.aws
DOCKER_IMAGE:=agilesyndrome/aws-heic-converter

LIBPNG_VERSION:=1.6.37
IMAGEMAGICK_VERSION:=7.1.0-13
LIBHEIF_VERSION:=1.12.0
LIBDE265_VERSION:=1.0.8
GRAPHICSMAGIC_VERSION:=1.3.36



build:
	aws ecr-public get-login-password --region us-east-1 | docker login --username AWS --password-stdin public.ecr.aws
	docker build --build-arg CACHE_KEY=Standard -t $(DOCKER_IMAGE) .

clean:
	rm -rf ./cache
	@echo "This will prune all Docker images and caches on this sysytem... not just ones related to this project"
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

./cache/GraphicsMagic-%:
	@echo "Caching $@"
	@mkdir -p ./cache
	curl -L -o GraphicsMagick-$*.tar.xz https://sourceforge.net/projects/graphicsmagick/files/graphicsmagick/$*/GraphicsMagick-$*.tar.xz/download
	@tar -xzvf GraphicsMagick-$*.tar.xz -C ./cache

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
	@make ./cache/GraphicsMagic-$(GRAPHICSMAGIC_VERSION)

	# Save Cache
	aws s3 sync ./cache s3://artifacts.agilesyndrome.private/syndrome-magick --exclude '*' --include '*.tar.gz' --include '*.zip' --include '*.xz' --exclude 'aws/*'


serve: build
	docker run \
		-p 9000:8080 \
		-e AWS_ACCESS_KEY_ID \
		-e AWS_SECRET_ACCESS_KEY \
		-e AWS_REGION \
		$(DOCKER_IMAGE)

shell:
	docker run \
		-e AWS_ACCESS_KEY_ID \
		-e AWS_SECRET_ACCESS_KEY \
		-e AWS_REGION \
		-v $(PWD)/tests:/tests \
		-it --entrypoint bash $(DOCKER_IMAGE)

test:
	@#curl -XPOST "http://localhost:9000/2015-03-31/functions/function/invocations" -d '{}'
	@curl -XPOST "http://localhost:9000/2015-03-31/functions/function/invocations" -d '{"source": { "Bucket": "$(S3_BUCKET)", "Key": "$(S3_KEY)"}}'

.PHONY: cache