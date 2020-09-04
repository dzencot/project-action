#!/bin/sh -l

mkdir -p /tmp/builds/source

ls -la  /tmp

docker run -v "/tmp/builds:/tmp/builds" $1:release bash -c 'ls -la /tmp/builds'
docker run -v "/tmp/builds:/tmp/builds" $1:release bash -c 'cp -r /project/* /tmp/builds/source && rm -rf /tmp/builds/source/code'

mkdir -p /tmp/builds/source/code
cp -r `pwd`/* /tmp/builds/source/code
cd /tmp/builds/source && docker-compose run development make setup test lint
