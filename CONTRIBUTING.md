# Contributing

1. Fork and branch off `main`.
2. `npm install`
3. Make your change with tests (`npm test`).
4. `npm run lint && npm run typecheck && npm run build` must pass.
5. `npm run build && npm run smoke` should pass locally if you touched transport/serving code.
6. Commit using [Conventional Commits](https://www.conventionalcommits.org/) — the commit
   type drives the semantic-release version bump (`fix:`, `feat:`, `feat!:`/`BREAKING CHANGE:`).
7. Open a PR against `main`.

## Local testing

```bash
export AXCIENT_API_KEY=your-key
npm run build
npm start   # stdio transport

# or HTTP transport:
MCP_TRANSPORT=http npm start
```
