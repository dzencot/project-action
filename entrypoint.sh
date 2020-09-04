#!/bin/sh -l

mkdir -p /tmp/builds/source

docker run -v "/tmp/builds:/mnt" $1:release bash -c 'cp -r /project/* /mnt/source && rm -rf /mnt/source/code'

mkdir -p /tmp/builds/source/code
cp -r `pwd`/* /tmp/builds/source/code
cd /tmp/builds/source && docker-compose run development make setup test lint
