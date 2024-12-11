// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Application } = require('../dist/commonjs/index.js');

const app = new Application();

// response
app.use(ctx => {
  ctx.body = `Hello Koa, from ${ctx.ip}`;
});

app.listen(3000);
