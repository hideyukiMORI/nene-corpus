import { setupServer } from 'msw/node';

// No baked-in handlers: this package has a single small surface
// (`createAdminTransport`), so each test registers the handlers it needs via
// `server.use(...)` rather than maintaining a shared handlers/ tree (the
// fleet's larger single-app frontends — nene-payout, nene-vault — use a
// handlers/ directory because they have many more endpoints under test).
export const server = setupServer();
