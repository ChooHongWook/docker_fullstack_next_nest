# Playwright MCP Integration

This project includes Playwright MCP (Model Context Protocol) integration for AI-powered browser automation and testing.

## What is Playwright MCP?

Playwright MCP is a Model Context Protocol server that enables AI assistants like Claude to interact with web browsers through structured accessibility snapshots. Unlike traditional screenshot-based automation, it uses Playwright's accessibility tree for deterministic, lightweight browser automation.

## Installation

The Playwright MCP server has been configured in this project. The configuration is located in:

```
.claude/mcp.json
```

## Features

- **Accessibility-first**: Uses Playwright's accessibility tree instead of pixel-based interaction
- **Lightweight**: No vision model requirements; operates purely on structured data
- **Deterministic**: Eliminates ambiguity typical of screenshot-based approaches
- **Multi-browser**: Supports Chromium, Firefox, and WebKit

## Available Commands

### Run Playwright Tests

```bash
# Run all tests
pnpm test:playwright

# Run tests in UI mode
pnpm test:playwright:ui

# Run tests in headed mode (see the browser)
pnpm test:playwright:headed

# Show test report
pnpm test:playwright:report
```

### Install Additional Browsers

```bash
# Install all browsers
pnpm exec playwright install

# Install specific browser
pnpm exec playwright install chromium
pnpm exec playwright install firefox
pnpm exec playwright install webkit
```

## Configuration

The Playwright configuration is located at `playwright.config.ts` in the project root.

### Key Settings

- **Test Directory**: `tests/e2e/`
- **Base URL**: `http://localhost:3000` (Frontend) or configured via `NEXT_PUBLIC_API_URL`
- **Browsers**: Chromium, Firefox, WebKit
- **Parallel Execution**: Enabled by default
- **Retries**: 2 on CI, 0 locally

## Writing Tests

Create test files in `tests/e2e/` with the `.spec.ts` extension.

### Example Test

```typescript
import { test, expect } from '@playwright/test';

test.describe('Frontend Application', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Next\.js/i);
  });

  test('should have heading', async ({ page }) => {
    await page.goto('/');
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });
});
```

### API Testing

```typescript
test.describe('API Health Check', () => {
  test('should return health status', async ({ request }) => {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const response = await request.get(`${baseURL}/health`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('status');
  });
});
```

## MCP Server Usage

When using Claude Code or other MCP-compatible clients, the Playwright MCP server provides browser automation capabilities through natural language commands.

### Example Interactions

- "Navigate to the homepage and check if the title contains 'Next.js'"
- "Click the login button and verify the form appears"
- "Fill out the contact form and submit it"
- "Take a screenshot of the dashboard"

The MCP server translates these requests into Playwright commands and executes them using the accessibility tree.

## Troubleshooting

### Browser Not Found

If you see "Browser not found" errors, install the browsers:

```bash
pnpm exec playwright install
```

### Permission Denied

Make sure the Playwright commands are added to `.claude/settings.local.json` permissions:

```json
{
  "permissions": {
    "allow": [
      "Bash(pnpm test:playwright:*)",
      "Bash(playwright test:*)",
      "Bash(playwright show-report:*)",
      "Bash(pnpm exec playwright:*)"
    ]
  }
}
```

## Resources

- [Playwright MCP Official Documentation](https://github.com/microsoft/playwright-mcp)
- [Playwright Test Documentation](https://playwright.dev/docs/intro)
- [Model Context Protocol](https://modelcontextprotocol.io/)

## Related Tools

- **@executeautomation/playwright-mcp-server**: Alternative MCP server with 143 device emulations
- **playwright-mcp**: Community-maintained MCP server with real-time DOM access

For more information, see:

- [@playwright/mcp on npm](https://www.npmjs.com/package/@playwright/mcp)
- [Playwright MCP Server Guide](https://executeautomation.github.io/mcp-playwright/docs/intro)
