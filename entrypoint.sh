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

# 1. Create the agent
echo "Creating an agent..."
RESPONSE=$(node /create-agent.js "$prompt" "$repository" "$OKTETO_TOKEN" "$OKTETO_CONTEXT")
if [ $? -ne 0 ]; then
  echo "Failed to create agent"
  exit 1
fi

CHAT_URL=$(echo "$RESPONSE" | jq -r '.chat_url')

# 2. Comment on the GitHub issue
echo "Commenting on the issue..."
GITHUB_API="https://api.github.com"
ISSUE_NUMBER=$(jq --raw-output .issue.number "$GITHUB_EVENT_PATH")
REPO_FULL_NAME=$(jq --raw-output .repository.full_name "$GITHUB_EVENT_PATH")
COMMENT_BODY="✅ Okteto AI agent has been created and is working on this issue."

if [ -z "$COMMENT_BODY" ]; then
  COMMENT_BODY=$(cat <<EOF
  ✅ Okteto AI agent has been created and is working on this issue.

  You can chat with the agent here: $CHAT_URL
  EOF
  )
fi

curl -s -X POST "$GITHUB_API/repos/$REPO_FULL_NAME/issues/$ISSUE_NUMBER/comments" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg body "$COMMENT_BODY" '{body: $body}')"

echo "Agent created successfully"