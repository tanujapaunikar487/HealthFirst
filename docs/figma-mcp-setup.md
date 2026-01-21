# Figma MCP Server Setup Guide

## Installation Complete ✅

The Figma MCP server has been installed globally via npm:
- Package: `figma-developer-mcp`
- Node.js version: v25.3.0
- npm version: 11.7.0

---

## Getting Your Figma API Token

To use the Figma MCP server, you need a Figma access token:

1. **Go to Figma Settings**
   - Visit: https://www.figma.com/settings
   - Or click your avatar → Settings

2. **Generate Access Token**
   - Scroll to "Personal access tokens"
   - Click "Create new token"
   - Give it a name (e.g., "MCP Server")
   - Click "Generate token"
   - **Copy the token immediately** (you won't see it again)

---

## Running the Figma MCP Server

### Option 1: Direct Command (for testing)

```bash
export PATH="/opt/homebrew/bin:$PATH"
npx -y figma-developer-mcp --figma-api-key=YOUR_TOKEN_HERE --stdio
```

### Option 2: With Environment Variable

```bash
export PATH="/opt/homebrew/bin:$PATH"
export FIGMA_API_KEY=YOUR_TOKEN_HERE
npx -y figma-developer-mcp --stdio
```

### Option 3: Run on Specific Port (HTTP server)

```bash
export PATH="/opt/homebrew/bin:$PATH"
export FIGMA_API_KEY=YOUR_TOKEN_HERE
npx -y figma-developer-mcp --port 3845
```

This will start the MCP server on `http://127.0.0.1:3845/mcp` (matching your mcp.json config).

---

## Your Current MCP Configuration

Location: `/Users/tanujapaunikar/Library/Application Support/Code/User/mcp.json`

```json
{
  "servers": {
    "figma": {
      "url": "http://127.0.0.1:3845/mcp",
      "type": "http"
    },
    "com.figma.mcp/mcp": {
      "type": "http",
      "url": "https://mcp.figma.com/mcp",
      "gallery": "https://api.mcp.github.com",
      "version": "1.0.3"
    }
  },
  "inputs": []
}
```

**You have two servers configured:**
1. **Local server** at port 3845 (needs to be started manually)
2. **Official Figma remote server** at `https://mcp.figma.com/mcp` (always available)

---

## Using the Remote Server (Recommended)

The official Figma remote MCP server (`https://mcp.figma.com/mcp`) is the easiest option:

1. **No local server needed** - it's already running
2. **Just need your Figma API token** - configure it in your MCP client
3. **Always up-to-date** - maintained by Figma

You can use this server directly in Claude Desktop or VS Code MCP extensions.

---

## Next Steps

1. **Get your Figma API token** from https://www.figma.com/settings
2. **Choose an approach:**
   - Use the remote server (easiest)
   - Or run the local server on port 3845
3. **Configure your MCP client** (Claude Desktop, VS Code, etc.) with the token

---

## Testing the Server

Once you have your token, test it:

```bash
export PATH="/opt/homebrew/bin:$PATH"
export FIGMA_API_KEY=your_actual_token
npx -y figma-developer-mcp --port 3845
```

Then you can access it at: `http://127.0.0.1:3845/mcp`

---

## Troubleshooting

**Error: "Access token expired"**
- Generate a new token from Figma settings

**Error: "Port already in use"**
- Change the port: `--port 3846`
- Or kill the existing process

**Error: "Cannot find module"**
- Run: `export PATH="/opt/homebrew/bin:$PATH"`
- Reinstall: `npm install -g figma-developer-mcp`

---

## Using with Claude Code

Unfortunately, Claude Code (CLI) cannot directly access MCP servers via HTTP. To use Figma designs:

1. **Use Claude Desktop** with the Figma MCP server
2. **Export the design data** and share it with Claude Code
3. **Or share Figma screenshots** directly in Claude Code conversations

---

**Ready to use!** Get your Figma API token and start the server.
