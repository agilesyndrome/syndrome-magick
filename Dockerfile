FROM public.ecr.aws/agilesyndrome/syndrome-magick-base:latest

COPY src/package.json src/package-lock.json ${LAMBDA_TASK_ROOT}/
RUN npm install

COPY src/ ${LAMBDA_TASK_ROOT}/
CMD [ "index.handler" ]