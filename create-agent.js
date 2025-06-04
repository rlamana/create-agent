#!/usr/bin/env node

const https = require('https');
const { URL } = require('url');

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 7) {
  console.error('Usage: node create-agent.js <prompt> <repository> <okteto-token> <okteto-context> <github-token> <issue-number> <repo-full-name>');
  console.error('\nExample:');
  console.error('  node create-agent.js "Fix the login bug" "https://github.com/okteto/movies" "your-okteto-token" "https://your-oktetocontext.com" "your-github-token" 42 okteto/movies');
  process.exit(1);
}

const [prompt, repository, oktetoToken, oktetoContext, githubToken, issueNumber, repoFullName] = args;

const expandedPrompt = `
Issue #${issueNumber}

${prompt}

Please work on solving the task described above. After completing the changes:

1. Commit your modifications to the current branch in the repository.
2. Use a meaningful commit message.
3. Create a pull request with a clear and descriptive title and body.
4. Make sure the pull request references the original GitHub issue #${issueNumber}.
5. Don't for repositories if you don't have permissions to push changes directly.
6. Use okteto to build and run the application locally to test your changes before committing.
`;

// Prepare the Okteto request payload
const oktetoPayload = {
  prompt: expandedPrompt,
  repository
};

// Okteto API endpoint
let apiUrl;
try {
  apiUrl = new URL('/api/v0/agents', oktetoContext.endsWith('/') ? oktetoContext : oktetoContext + '/');
} catch {
  console.error('Invalid Okteto context URL:', oktetoContext);
  process.exit(1);
}

console.log('Creating Okteto agent...');
console.log(`Repository: ${repository}`);
console.log(`Prompt: ${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}`);

// 1. Create Okteto agent
const oktetoReq = https.request({
  hostname: apiUrl.hostname,
  port: 443,
  path: apiUrl.pathname,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${oktetoToken}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(JSON.stringify(oktetoPayload))
  }
}, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 201) {
      let agentID = null;

      try {
        const response = JSON.parse(data);
        agentID = response.id;
        console.log('\n✅ Agent created successfully!\n');
        console.log('Agent Details:');
        console.log(`- ID: ${response.id || 'N/A'}`);
        console.log(`- Status: ${response.status || 'N/A'}`);
        if (response.vscode_url) {
          console.log(`- VS Code URL: ${response.vscode_url}`);
        }
        console.log('\nFull response:');
        console.log(JSON.stringify(response, null, 2));
      } catch (error) {
        console.error('Error parsing response:', error.message);
        console.error('Raw response:', data);
        process.exit(1);
      }

      // 2. Comment on GitHub issue
      let comment = `✅ Okteto AI agent has been created and is working on this issue.
\n\nYou can chat with the agent here: ${oktetoContext}/agents/${agentID}`;


      const commentPayload = {
        body: comment
      };

      let commentApiUrl;
      try {
        commentApiUrl = new URL(`/repos/${repoFullName}/issues/${issueNumber}/comments`, 'https://api.github.com/');
      } catch {
        console.error('Invalid GitHub comments URL');
        process.exit(1);
      }

      const githubReq = https.request({
        hostname: commentApiUrl.hostname,
        path: commentApiUrl.pathname,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'User-Agent': 'okteto-agent-script',
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(JSON.stringify(commentPayload))
        }
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });

        res.on('end', () => {
          if (res.statusCode === 200 || res.statusCode === 201) {
            console.log(`\n✅ Commented on GitHub issue ${issueNumber} successfully!\n`);
          } else {
            console.error(`\n❌ Failed to comment on GitHub issue ${issueNumber}. HTTP Status: ${res.statusCode}`);
            console.error('Response:', data);
            try {
              const errorResponse = JSON.parse(data);
              if (errorResponse.error || errorResponse.message) {
                console.error('Error details:', errorResponse.error || errorResponse.message);
              }
            } catch {
              // raw response already printed
            }
            process.exit(1);
          }
        });
      });

      githubReq.on('error', (error) => {
        console.error('GitHub request failed:', error.message);
        process.exit(1);
      });

      githubReq.write(JSON.stringify(commentPayload));
      githubReq.end();

    } else {
      console.error(`\n❌ Failed to create agent. HTTP Status: ${res.statusCode}`);
      console.error('Response:', data);

      try {
        const errorResponse = JSON.parse(data);
        if (errorResponse.error || errorResponse.message) {
          console.error('Error details:', errorResponse.error || errorResponse.message);
        }
      } catch {
        // raw response already printed
      }
      process.exit(1);
    }
  });
});

oktetoReq.on('error', (error) => {
  console.error('Request failed:', error.message);
  process.exit(1);
});

oktetoReq.write(JSON.stringify(oktetoPayload));
oktetoReq.end();
