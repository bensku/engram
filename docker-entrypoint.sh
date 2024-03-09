#!/bin/sh

task=$1

if [ "$task" = "batch" ]; then
  job=$2
  if [ "$job" = "embed" ]; then
    # TODO not yet runnable within Docker
    echo "Not supported with Docker yet."
  elif [ "$job" = "pull-wikipedia" ]; then
    backend/src/batch/job/pull-wikipedia.sh /data "$3" "$4"
  elif [ "$job" = "load-wikipedia" ]; then
    backend/src/batch/job/load-wikipedia.sh /data "$3" "$4"
  elif [ "$job" = "drop-wikipedia" ]; then
    # TODO not yet runnable within Docker
    echo "Not supported with Docker yet."
  else
    echo "Unknown batch job: $job"
  fi
elif [ "$task" = "run" ]; then
  echo "Launching engram backend+frontend bundle..."
  cd backend
  node src/app.js
else
  echo "Unknown task: $1"
fi
