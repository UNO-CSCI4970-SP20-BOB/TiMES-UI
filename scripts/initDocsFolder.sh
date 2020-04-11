#!/bin/bash
# Initialize Docs Folder.
set -v
REPO="https://github.com/UNO-CSCI4970-SP20-BOB/TiMES-UI.git"
mkdir ./docs
cd ./docs
git clone --single-branch --branch gh-pages $REPO .
exit 0
