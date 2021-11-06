FROM public.ecr.aws/lambda/nodejs:14 as builder

RUN mkdir -p /opt/extensions \
 && yum upgrade -y \
 && yum install -y \
    file \
    gcc-c++ \
    gzip \
    jq \
    less \
    libjpeg \
    make \
    libjpeg-turbo-devel \
    openjpeg2-devel \
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
ENV PATH=${PATH}:${LAMBDA_TASK_ROOT}/bin

# LibPng
RUN cd libpng-* \
 && ./configure > configure.log \
 && make \
 && make install

# Libde256
RUN cd libde265-* \
 && ./configure > configure.log \
 && make \
 && make install

RUN cd libheif-* \
 && ./configure > configure.log \
 && make \
 && make install

# ImageMagick
RUN cd ImageMagick-* \
 && ./configure \
    --with-jpeg=yes \
    --with-png=yes \
    --with-heic=yes > configure.log \
 && make \
 && make install

# GraphicsMagick
RUN cd GraphicsMagick-* \
 && ./configure \
 && make \
 && make install\
 && make check

#Default ${LAMBDA_TASK_ROOT:-/var/task}
WORKDIR ${LAMBDA_TASK_ROOT}

COPY src/package.json src/package-lock.json ${LAMBDA_TASK_ROOT}
RUN npm install

COPY src/ ${LAMBDA_TASK_ROOT}
CMD [ "index.handler" ]