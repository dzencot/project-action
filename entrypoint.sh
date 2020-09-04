#!/bin/sh -l

echo "mkdir"
mkdir -p /tmp/builds/source

echo $GITHUB_WORKSPACE
echo "$(ls -la $GITHUB_WORKSPACE)"

docker run -v "/tmp/builds/source:/tmp/builds/source:rw" $1:release bash -c 'cp -r /project/* /tmp/builds/source && ls -la /tmp/builds/source && rm -rf /tmp/builds/source/code'

echo "ls -la /tmp/builds/source"
ls -la /tmp/builds/source

# mkdir -p /tmp/builds/source/code
# cp -r $(pwd)/* /tmp/builds/source/code

# ls -la /tmp/builds/source

# ls -la $(pwd)

# cd /tmp/builds/source && docker-compose run development make setup test lint
