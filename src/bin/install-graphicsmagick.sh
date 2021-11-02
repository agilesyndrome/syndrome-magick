#!/bin/bash
set -ex

cd GraphicsMagick-*

./configure
make
make install
make check
