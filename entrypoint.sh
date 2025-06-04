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

ISSUE_NUMBER=$(jq --raw-output .issue.number "$GITHUB_EVENT_PATH")
REPO_FULL_NAME=$(jq --raw-output .repository.full_name "$GITHUB_EVENT_PATH")

# 1. Create the agent
echo "Creating an agent..."
/create-agent.js "$prompt" "$repository" "$OKTETO_TOKEN" "$OKTETO_CONTEXT" "$GITHUB_TOKEN" "$ISSUE_NUMBER" "$REPO_FULL_NAME"
if [ $? -ne 0 ]; then
  echo "Failed to create agent"
  exit 1
fi