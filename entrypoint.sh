#!/bin/sh
set -e

prompt=$1
repository=$2

if [ -z $prompt ]; then
  echo "A prompt is required"
  exit 1
fi

if [ -z $repository ]; then
  echo "A repository is required"
  exit 1
fi

/create-agent.js $prompt $repository $OKTETO_TOKEN $OKTETO_CONTEXT
if [ $? -ne 0 ]; then
  echo "Failed to create agent"
  exit 1
fi
echo "Agent created successfully"