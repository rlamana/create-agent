# AI Agent GitHub Action

A reusable GitHub Action that creates Okteto AI agents programmatically. Use it to automate AI-powered development tasks like issue resolution, code reviews, and maintenance.

## Features

- 🤖 **Automated Agent Creation**: Create Okteto AI agents from GitHub events
- 🔧 **Flexible Triggers**: Use with issues, pull requests, manual dispatch, or scheduled workflows
- 💬 **Issue Comments**: Automatically comment on issues with agent details
- 🎯 **Custom Prompts**: Define specific tasks and instructions for agents
- 📊 **Output Variables**: Access agent ID, URLs, and status in subsequent steps

## Quick Start

### Using as a Reusable Action

```yaml
- name: Create Okteto AI Agent
  uses: okteto/agent-action@v1  # or rlamana/agent-action@v1
  with:
    okteto-token: ${{ secrets.OKTETO_TOKEN }}
    prompt: "Your task description here"
```

### Example: Auto-create Agent on Issues

```yaml
name: Create Agent on Issue
on:
  issues:
    types: [opened]

jobs:
  create-agent:
    runs-on: ubuntu-latest
    steps:
    - uses: okteto/agent-action@v1
      with:
        okteto-token: ${{ secrets.OKTETO_TOKEN }}
        prompt: |
          Issue #${{ github.event.issue.number }}: ${{ github.event.issue.title }}
          
          ${{ github.event.issue.body }}
          
          Instructions: Implement a solution and create a PR.
```

## Action Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `okteto-token` | Okteto API access token | Yes | - |
| `prompt` | Task description for the AI agent | Yes | - |
| `repository` | GitHub repository URL | No | Current repository |
| `branch` | Target branch for the agent | No | Default branch |
| `comment-on-issue` | Comment on issue with agent details | No | `true` |
| `issue-number` | Issue number to comment on | No | Current issue |
| `github-token` | GitHub token for commenting | No | `${{ github.token }}` |

## Action Outputs

| Output | Description |
|--------|-------------|
| `agent-id` | The ID of the created agent |
| `chat-url` | URL to chat with the agent |
| `vscode-url` | URL to open the agent in VS Code |
| `status` | Status of the created agent |

## Setup

### 1. Add to Your Repository

#### Option A: Use as External Action
Simply reference this action in your workflows:
```yaml
uses: okteto/agent-action@v1
```

#### Option B: Copy to Your Repository
Copy the entire repository or just the `action.yml` file to your repository.

### 2. Configure Secrets

You need to add the following secrets to your repository:

1. **OKTETO_TOKEN**: Your Okteto API access token
   - Go to your repository's Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `OKTETO_TOKEN`
   - Value: Your Okteto API token

2. **GITHUB_TOKEN**: This is automatically provided by GitHub Actions, but ensure it has the necessary permissions:
   - Go to Settings → Actions → General
   - Under "Workflow permissions", select "Read and write permissions"
   - Check "Allow GitHub Actions to create and approve pull requests"

## How It Works

1. **Trigger**: The action triggers on the `issues` event with `opened` action type
2. **Data Extraction**: It extracts:
   - Issue title and body
   - Repository URL
   - Default branch name
3. **Prompt Enhancement**: The issue description is enhanced with instructions:
   ```
   "Commit the changes and send a pull request to GitHub with a proper title and description, referencing the original issue."
   ```
4. **API Request**: Sends a POST request to:
   ```
   https://okteto.agentfleets.dev.okteto.net/public-api/v0/agents
   ```
   With payload:
   ```json
   {
     "prompt": "<enhanced issue description>",
     "repository": "<repository URL>",
     "branch": "<default branch>"
   }
   ```
5. **Issue Comment**: Posts a comment on the issue with:
   - Agent status
   - Agent ID
   - Chat URL (if available)
   - VS Code URL (if available)

## Example Issue Comment

When successful, the action will post a comment like:

> 🤖 **Okteto AI Agent Created!**
> 
> An AI agent has been created to work on this issue.
> 
> **Agent Details:**
> - **Status:** active
> - **Agent ID:** agent-123456
> - **Chat URL:** [Open Chat](https://okteto.agentfleets.dev.okteto.net/chat/agent-123456)
> - **VS Code URL:** [Open in VS Code](https://okteto.agentfleets.dev.okteto.net/vscode/agent-123456)
> 
> The agent will analyze this issue and create a pull request with the proposed solution.

## Error Handling

If the agent creation fails, the action will:
1. Log the error details in the workflow logs
2. Post an error comment on the issue
3. Exit with a non-zero status code

## Customization

You can customize the action by modifying:
- The prompt enhancement logic
- The branch selection (currently uses default branch)
- The comment format
- Additional API parameters if supported

## Security Considerations

- The `OKTETO_TOKEN` is stored as a secret and never exposed in logs
- The action uses GitHub's built-in `GITHUB_TOKEN` for commenting on issues
- All API requests use HTTPS

## Examples

Check the `examples/` directory for more use cases:

- **[on-issue-opened.yml](examples/on-issue-opened.yml)**: Auto-create agents for new issues
- **[on-pull-request.yml](examples/on-pull-request.yml)**: AI-powered code reviews
- **[manual-trigger.yml](examples/manual-trigger.yml)**: Create agents on demand
- **[scheduled-maintenance.yml](examples/scheduled-maintenance.yml)**: Automated maintenance tasks

## Advanced Usage

### Using Output Variables

```yaml
- name: Create Agent
  id: agent
  uses: okteto/agent-action@v1
  with:
    okteto-token: ${{ secrets.OKTETO_TOKEN }}
    prompt: "Update dependencies"

- name: Use Agent Details
  run: |
    echo "Agent ID: ${{ steps.agent.outputs.agent-id }}"
    echo "Chat URL: ${{ steps.agent.outputs.chat-url }}"
```

### Custom Repository and Branch

```yaml
- uses: okteto/agent-action@v1
  with:
    okteto-token: ${{ secrets.OKTETO_TOKEN }}
    prompt: "Fix security vulnerabilities"
    repository: "https://github.com/okteto/movies"
    branch: "develop"
```

### Disable Issue Comments

```yaml
- uses: okteto/agent-action@v1
  with:
    okteto-token: ${{ secrets.OKTETO_TOKEN }}
    prompt: "Run tests"
    comment-on-issue: 'false'
```

## Testing

### Using the Standalone Script

Test the API integration locally:

```bash
cd scripts
export OKTETO_TOKEN="your-token"
./create-okteto-agent.sh "Test prompt" "https://github.com/user/repo" "main"
```

### In GitHub Actions

1. Fork this repository
2. Add your `OKTETO_TOKEN` secret
3. Create an issue to trigger the workflow
4. Check the Actions tab for logs

## API Reference

**Endpoint**: `https://okteto.agentfleets.dev.okteto.net/public-api/v0/agents`

**Method**: POST

**Headers**:
- `Authorization: Bearer <OKTETO_TOKEN>`
- `Content-Type: application/json`

**Payload**:
```json
{
  "prompt": "Task description",
  "repository": "GitHub repository URL",
  "branch": "Target branch (optional)"
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

- 📚 [Okteto Documentation](https://www.okteto.com/docs)
- 💬 [Okteto Community](https://community.okteto.com)
- 🐛 [Report Issues](https://github.com/okteto/agent-action/issues)

## License

This project is open source and available under the [MIT License](LICENSE).