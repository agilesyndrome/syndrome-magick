#!/bin/bash
set -ex

cd ImageMagick-*

./configure \
   --with-jpeg=yes \
   --with-png=yes \
   --with-heic=yes > configure.log

make
make install
