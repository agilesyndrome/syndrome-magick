#!/bin/bash
set -ex

cd libde265-*
./configure > configure.log
make
make install
