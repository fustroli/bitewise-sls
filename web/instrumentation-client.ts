import { z } from 'zod';

// Zod's JIT probes `new Function`, which the CSP forbids (the CloudFront
// response headers policy); skip it so the browser logs no violation.
z.config({ jitless: true });
