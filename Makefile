####################################
# Build command for Chrome Extension
####################################

.PHONY: help build

help:
	$(info ${HELP_MESSAGE})
	@exit 0

build:
	@echo 'Removing prior build...' 
	@rm -rf dist/*
	@rm -f latestBuild.zip
	@echo 'Prior build removed!' 
	@echo 'Preparing new extension build..' 
	@mkdir -p dist
	@echo 'Bundling JavaScript files...'
	@npx webpack --config webpack.config.js
	@echo 'Copying additional files...'
	@cp src/extension-styles.css dist/
	@echo 'Zipping up build files for upload...'
	@cd dist && zip -r -X ../latestBuild.zip *
	@echo 'New extension build ready for upload!' 
	@exit 0

define HELP_MESSAGE

	--- Run this command to prepare the build for upload ---
	$ make build

endef
