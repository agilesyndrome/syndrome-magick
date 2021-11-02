#!/bin/bash
set -ex

cd libpng-*
./configure > configure.log
make
make install
