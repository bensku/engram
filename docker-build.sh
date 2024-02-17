#!/bin/bash
docker build --target backend -t git.benjami.fi/benjami/engram-backend .
docker push git.benjami.fi/benjami/engram-backend