install:
	npm install

build:
	npm run build

test:
	npx jest

# TODO: release authomatically after build
release:
	git push -f origin master:release
