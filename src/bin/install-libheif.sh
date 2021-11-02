#!/bin/bash
set -ex

cd libheif-*
./configure > configure.log
make
make install

