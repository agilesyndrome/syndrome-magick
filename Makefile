DOCKER_REPO:=gallery.ecr.aws
DOCKER_IMAGE:=agilesyndrome/aws-heic-converter

build:
	aws ecr-public get-login-password --region us-east-1 | docker login --username AWS --password-stdin public.ecr.aws
	docker build --build-arg CACHE_KEY=Standard -t $(DOCKER_IMAGE) .

clean:
	@echo "This will prune all Docker images and caches on this sysytem... not just ones related to this project"
	docker system prune -a

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
		-it --entrypoint bash $(DOCKER_IMAGE)

test:
	@#curl -XPOST "http://localhost:9000/2015-03-31/functions/function/invocations" -d '{}'
	@curl -XPOST "http://localhost:9000/2015-03-31/functions/function/invocations" -d '{"source": { "Bucket": "$(S3_BUCKET)", "Key": "$(S3_KEY)"}}'