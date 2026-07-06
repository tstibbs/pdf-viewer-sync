#!/bin/bash

set -euxo pipefail

currentDir=$(pwd)
codeDir=$(git rev-parse --show-toplevel)
revision=$(git rev-parse HEAD)
tmp=$(mktemp --directory)

cd $tmp
git clone --single-branch --branch=gh-pages --depth=1 file://$codeDir
cd pdf-viewer-sync
rm -rf *
cp -R $codeDir/ui-additions/dist/* ./
rm web/compressed.tracemonkey-pldi-09.pdf
rm LICENSE
git add .

if ! git diff-index --quiet HEAD
then
	git commit -m "Deploying $revision"
	git push origin gh-pages
else
    echo "Skipping commit, as there are no changes."
fi
