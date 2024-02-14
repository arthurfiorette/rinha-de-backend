import { Env } from './util/env.js';
import { createServer } from './server/index.js';

createServer().then((srv) => srv.listen(Env.PORT));
