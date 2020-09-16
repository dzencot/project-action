#!/bin/sh -l

echo "mkdir"
mkdir -p /tmp/builds/source

echo "ls -la /project/"

docker run --name project-source  $1:release bash -c 'ls -la /project/'
echo "docker cp"
docker cp  project-source:/project/ /tmp/builds/source

echo "ls -la tmp"
ls -la /tmp/builds/source/project/

# mkdir -p /tmp/builds/source/code
# cp -r $(pwd)/* /tmp/builds/source/code

# ls -la /tmp/builds/source

# ls -la $(pwd)

# cd /tmp/builds/source && docker-compose run development make setup test lint
