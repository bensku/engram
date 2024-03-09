#!/bin/bash
set -euo pipefail

docker build -t git.benjami.fi/benjami/engram .
docker push git.benjami.fi/benjami/engram