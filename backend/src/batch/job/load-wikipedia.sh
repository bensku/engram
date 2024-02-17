#!/bin/sh
set -eu
path=$1
wiki=$2
db_url=$3

npx dumpster-dive "$path/$wiki.xml" --citations=false --db_url=$db_url --db=$wiki