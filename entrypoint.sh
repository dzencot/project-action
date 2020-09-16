#!/bin/sh -l

docker run --name project-source  $1:release bash -c 'ls -la /project/'
docker cp  project-source:/project /tmp

rm -rf /tmp/project/code/*

ls -la $(pwd)

cp -r $(pwd)/* /tmp/project/code/

cat /tmp/project/Makefile

cd /tmp/project && docker-compose run development cat Makefile
cd /tmp/project && docker-compose run development ls -la /project

docker ps -a
docker inspect $(docker ps -a | grep 'project_development' | awk '{print $1}')

# cd /tmp/project && docker-compose run development make setup test lint
