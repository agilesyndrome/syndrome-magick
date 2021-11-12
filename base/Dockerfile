FROM public.ecr.aws/lambda/provided:latest

# Allow us to purge Docker cache from Git
ARG BUILD_CACHE
RUN echo ${BUILD_CACHE} > .build_cache

RUN mkdir -p /opt/extensions \
 && yum upgrade -y \
 && yum install -y \
    clang \
    clang-devel \
    file \
    gcc-c++ \
    gzip \
    jq \
    less \
    llvm \
    llvm-devel \
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

# Install Rust
RUN curl -L -o rustup.sh https://sh.rustup.rs \
 && chmod +x ./rustup.sh \
 && ./rustup.sh -y

ENV PATH=/root/.cargo/bin:${PATH}

#Default ${LAMBDA_TASK_ROOT:-/var/task}
WORKDIR ${LAMBDA_TASK_ROOT}

RUN cargo init .
COPY Cargo* /var/task
RUN cargo build

#COPY src/package.json src/package-lock.json ${LAMBDA_TASK_ROOT}
#RUN npm install

#CMD [ "index.handler" ]