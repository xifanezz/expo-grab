#!/bin/bash

# Setup Expo Grab MCP server for Claude Code

MCP_SERVER_PATH="$(cd "$(dirname "$0")" && pwd)/index.js"
CLAUDE_CONFIG="$HOME/.claude/claude_desktop_config.json"

echo "Setting up Expo Grab MCP server..."
echo "MCP Server path: $MCP_SERVER_PATH"

# Create .claude directory if it doesn't exist
mkdir -p "$HOME/.claude"

# Create or update claude_desktop_config.json
if [ -f "$CLAUDE_CONFIG" ]; then
  # Check if expo-grab already exists
  if grep -q "expo-grab" "$CLAUDE_CONFIG"; then
    echo "expo-grab MCP server already configured"
  else
    echo "Adding expo-grab to existing config..."
    # Use node to safely merge JSON
    node -e "
      const fs = require('fs');
      const config = JSON.parse(fs.readFileSync('$CLAUDE_CONFIG', 'utf-8'));
      config.mcpServers = config.mcpServers || {};
      config.mcpServers['expo-grab'] = {
        command: 'node',
        args: ['$MCP_SERVER_PATH']
      };
      fs.writeFileSync('$CLAUDE_CONFIG', JSON.stringify(config, null, 2));
    "
    echo "Done!"
  fi
else
  echo "Creating new Claude config..."
  cat > "$CLAUDE_CONFIG" << EOF
{
  "mcpServers": {
    "expo-grab": {
      "command": "node",
      "args": ["$MCP_SERVER_PATH"]
    }
  }
}
EOF
  echo "Done!"
fi

echo ""
echo "MCP server setup complete!"
echo "Restart Claude Code to use the expo-grab tools."
