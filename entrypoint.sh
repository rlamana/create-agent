#!/bin/sh
set -e

prompt=$1
repository=$2

if [ -z "$prompt" ]; then
  echo "A prompt is required"
  exit 1
fi

if [ -z "$repository" ]; then
  echo "A repository is required"
  exit 1
fi

if [ -z "$OKTETO_TOKEN" ]; then
  echo "The Okteto token is required"
  exit 1
fi

if [ -z "$OKTETO_CONTEXT" ]; then
  echo "The Okteto context is required"
  exit 1
fi

echo "Working on the Okteto context: $OKTETO_CONTEXT"

/create-agent.js $prompt $repository $OKTETO_TOKEN $OKTETO_CONTEXT
if [ $? -ne 0 ]; then
  echo "Failed to create agent"
  exit 1
fi
echo "Agent created successfully"