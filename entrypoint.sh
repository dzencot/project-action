#!/bin/sh -l
export BUILD_DIRECTORY=$(pwd)/build

echo "BUILD_DIRECTORY"
echo $BUILD_DIRECTORY

ls -la $BUILD_DIRECTORY

docker run --name project-source  $1:release bash -c 'ls -la /project/'
docker cp  project-source:/project $BUILD_DIRECTORY

echo  "ls -la"

ls -la $BUILD_DIRECTORY

rm -rf $BUILD_DIRECTORY/code/*

cp -r !(build) $BUILD_DIRECTORY/code/

cat $BUILD_DIRECTORY/Makefile

cd $BUILD_DIRECTORY/project && docker-compose run development cat Makefile
# cd /tmp/project && docker-compose run development ls -la /project

# docker ps -a
# docker inspect $(docker ps -a | grep 'project_development' | awk '{print $1}')

# cd /tmp/project && docker-compose run development make setup test lint
