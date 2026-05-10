module.exports = {
  apps: [
    {
      name: 'nest-decider',
      script: 'server-dist/index.js',
      cwd: __dirname,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
}
