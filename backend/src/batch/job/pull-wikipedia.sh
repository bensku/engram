#!/bin/sh
set -eu

path=$1
wiki=$2
file="$wiki.xml.bz2"
source=$3

# Download the dump
curl -L -o "$path/$file" --time-cond "$path/$file" "$source"
# bzip2 eats the original file; we'll pretend this is fine for now
# NOTE: busybox bzip2 does NOT support --decompress or --force!
bzip2 -d -f "$path/$file"

echo "Pull done. Use load-wikipedia.sh to load into MongoDB."