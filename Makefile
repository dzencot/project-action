setup:
	echo 'setup';

install:
	npm install

build:
	npm run build

test:
	ACTIONS_RUNNER_DEBUG=1 npx jest

lint:
	npx eslint .

# TODO: release authomatically after build
release:
	git push -f origin master:release
