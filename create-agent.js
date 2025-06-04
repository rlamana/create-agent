#!/usr/bin/env node

const https = require('https');
const { URL } = require('url');

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 4) {
  console.error('Usage: node create-agent.js <prompt> <repository> <okteto-token> <okteto-context');
  console.error('\nExample:');
  console.error('  node create-agent.js "Fix the login bug" "https://github.com/okteto/movies" "your-okteto-token" "https://your-oktetocontext.com"');
  process.exit(1);
}

const [prompt, repository, oktetoToken, oktetoContext] = args;

// Check for required environment variable
if (!oktetoToken) {
  console.error('Error: oktetoToken environment variable is not set');
  console.error('Please set it with: export oktetoToken="your-token"');
  process.exit(1);
}

if (!oktetoContext) {
  console.error('Error: oktetoContext environment variable is not set');
  console.error('Please set it with: export oktetoContext="https://your-oktetocontext.com"');
  process.exit(1);
}

const expandedPrompt = `
${prompt}

Please work on solving the task described above. After completing the changes:

1. Commit your modifications to the current branch in the repository.
2. Use a meaningful commit message.
3. Create a pull request with a clear and descriptive title and body.
4. Make sure the pull request references the original GitHub issue.
`;

// Prepare the request payload
const payload = {
  prompt: expandedPrompt,
  repository
};

// API endpoint
let apiUrl;
try {
  apiUrl = new URL('/api/v0/agents', oktetoContext.endsWith('/') ? oktetoContext : oktetoContext + '/');
}catch {
  console.error('Invalid Okteto context URL:', oktetoContext);
  process.exit(1);
}

// Request options
const options = {
  hostname: apiUrl.hostname,
  port: 443,
  path: apiUrl.pathname,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${oktetoToken}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(JSON.stringify(payload))
  }
};

console.log('Creating Okteto agent...');
console.log(`Repository: ${repository}`);
console.log(`Prompt: ${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}`);

// Make the API request
const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 201) {
      try {
        const response = JSON.parse(data);
        
        console.log('\n✅ Agent created successfully!\n');
        console.log('Agent Details:');
        console.log(`- ID: ${response.id || 'N/A'}`);
        console.log(`- Status: ${response.status || 'N/A'}`);
        
        if (response.chat_url) {
          console.log(`- Chat URL: ${response.chat_url}`);
        }
        
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
    } else {
      console.error(`\n❌ Failed to create agent. HTTP Status: ${res.statusCode}`);
      console.error('Response:', data);
      
      try {
        const errorResponse = JSON.parse(data);
        if (errorResponse.error || errorResponse.message) {
          console.error('Error details:', errorResponse.error || errorResponse.message);
        }
      } catch {
        // If response is not JSON, it's already printed above
      }
      
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('Request failed:', error.message);
  process.exit(1);
});

// Send the request
req.write(JSON.stringify(payload));
req.end();