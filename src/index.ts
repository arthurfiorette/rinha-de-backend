import { createServer } from './server/index.js';
import { Env } from './util/env.js';

createServer().then((srv) => srv.listen(Env.PORT));
