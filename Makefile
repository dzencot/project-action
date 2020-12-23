install:
	npm install

build:
	npm run build

test:
	npx jest

lint:
	npx eslint .

# TODO: release authomatically after build
release:
	git push -f origin master:release
