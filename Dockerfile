FROM public.ecr.aws/lambda/nodejs:14 as builder

RUN mkdir -p /opt/extensions \
 && yum install -y \
    gcc-c++ \
    gzip \
    jq \
    less \
    libjpeg \
    make \
    tar \
    unzip \
    xz \
    zlib \
    zlib-devel

WORKDIR /build

COPY ./cache /build

RUN /build/aws/install \
    && aws --version

ENV LD_LIBRARY_PATH=${LD_LIBRARY_PATH}:/usr/local/lib
ENV PKG_CONFIG_PATH=/usr/local/lib/pkgconfig/
ENV CFLAGS=-I/usr/local/include
ENV LDFLAGS=-L/usr/local/lib
ENV PATH=${PATH}:/build/bin

COPY src/ /build/

RUN chmod +x ./bin/*.sh \
 && install-libpng.sh \
 && install-libde265.sh \
 && install-libheif.sh \
 && install-imagemagick.sh

#Default ${LAMBDA_TASK_ROOT:-/var/task}
WORKDIR ${LAMBDA_TASK_ROOT}

COPY package.json ${LAMBDA_TASK_ROOT}
RUN npm install

COPY *.js ${LAMBDA_TASK_ROOT}
CMD [ "index.handler" ]