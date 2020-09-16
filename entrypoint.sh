#!/bin/sh -l

echo "mkdir"
mkdir -p /tmp/builds/source

echo $GITHUB_WORKSPACE
echo "$(ls -la $GITHUB_WORKSPACE)"

docker run --name project  $1:release bash -c 'ls -la /project/*'
docker cp  project:/project/* .

ls -la $(pwd)

# mkdir -p /tmp/builds/source/code
# cp -r $(pwd)/* /tmp/builds/source/code

# ls -la /tmp/builds/source

# ls -la $(pwd)

# cd /tmp/builds/source && docker-compose run development make setup test lint
