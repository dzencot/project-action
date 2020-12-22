install:
	npm install

build:
	npm run build

# TODO: release authomatically after build
release:
	git push -f origin master:release
