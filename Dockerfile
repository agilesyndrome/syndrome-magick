FROM public.ecr.aws/lambda/nodejs:14

# GraphicsMagic: http://www.graphicsmagick.org/
ARG GM_VERSION=1.3.36

# ImageMagick: https://imagemagick.org/index.php
ARG IM_VERSION=7.1.0-13

#LibHeif: https://github.com/strukturag/libheif
ARG LIBHEIF_VERSION=1.12.0

# LibPng: http://www.libpng.org/pub/png/libpng.html
# ImageMagick 7.1.0-13 is currently pinned to LibPng 1.6
ARG LIBPNG16_VERSION=1.6.37

WORKDIR /gm

# Install base requirements, and various yum pkgs
RUN mkdir -p /opt/extensions \
 && yum install -y \
    gcc-c++ \
    gzip \
    libjpeg \
    make \
    tar \
    unzip \
    xz \
    zlib \
    zlib-devel \
  && curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" \
  && unzip awscliv2.zip \
  && ./aws/install

# Download files
RUN curl -L -o libpng-${LIBPNG16_VERSION}.tar.xz https://sourceforge.net/projects/libpng/files/libpng16/${LIBPNG16_VERSION}/libpng-${LIBPNG16_VERSION}.tar.xz/download \
 && curl -LO https://download.imagemagick.org/ImageMagick/download/ImageMagick-${IM_VERSION}.tar.xz \
 && curl -L -o GraphicsMagick-${GM_VERSION}.tar.xz https://sourceforge.net/projects/graphicsmagick/files/graphicsmagick/${GM_VERSION}/GraphicsMagick-${GM_VERSION}.tar.xz/download \
 && curl -L -o libheif-v${LIBHEIF_VERSION}.tar.gz https://github.com/strukturag/libheif/releases/download/v${LIBHEIF_VERSION}/libheif-${LIBHEIF_VERSION}.tar.gz

# Extract Files
RUN tar -xvf libpng-${LIBPNG16_VERSION}.tar.xz \
 && tar -xvf ImageMagick-${IM_VERSION}.tar.xz \
 && tar -xvf GraphicsMagick-${GM_VERSION}.tar.xz \
 && tar -xzvf libheif-v${LIBHEIF_VERSION}.tar.gz

# Install LibPng 1.6

RUN cd libpng-${LIBPNG16_VERSION} \
 && ./configure \
 && make \
 && make install \
 && echo "Installed LibPng"

ENV LD_LIBRARY_PATH=${LD_LIBRARY_PATH}:/gm/libpng-1.6.37/.libs

# Install LibHeif
RUN cd libheif-${LIBHEIF_VERSION} \
 && ./configure \
 && make \
 && make install \
 && echo "Installed LibHeif ${LIBHEIF_VERSION}"

# Install ImageMagick

RUN  cd ImageMagick-${IM_VERSION} \
 && ./configure \
 && make \
 && make install

# Install GraphicsMagick
RUN cd GraphicsMagick-${GM_VERSION} \
 && ./configure \
 && make \
 && make install \
 && make check

#Typically /var/task
WORKDIR ${LAMBDA_TASK_ROOT}

COPY package.json ${LAMBDA_TASK_ROOT}
RUN npm install

COPY *.js ${LAMBDA_TASK_ROOT}

# Set the CMD to your handler (could also be done as a parameter override outside of the Dockerfile)
CMD [ "index.handler" ]