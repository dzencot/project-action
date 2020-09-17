#!/bin/sh -l
export BUILD_DIRECTORY=$(pwd)/build

echo "BUILD_DIRECTORY"
echo $BUILD_DIRECTORY

docker run --name project-source  $1:release bash -c 'ls -la /project/'
docker cp  project-source:/project $BUILD_DIRECTORY

rm -rf $BUILD_DIRECTORY/code/*

cp -r $(ls | grep -v '^build$') $BUILD_DIRECTORY/code/

echo  "ls -la"
ls -la $BUILD_DIRECTORY/code

cd $BUILD_DIRECTORY && docker-compose run development cat Makefile
cd $BUILD_DIRECTORY && docker-compose run development ls -la

# docker ps -a
# docker inspect $(docker ps -a | grep 'project_development' | awk '{print $1}')

cd $BUILD_DIRECTORY && docker-compose run development make setup test lint
