const { Application } = require('..');

const app = new Application();

// response
app.use(ctx => {
  ctx.body = `Hello Koa, from ${ctx.ip}`;
});

app.listen(3000);
