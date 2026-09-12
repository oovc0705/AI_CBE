/**
 * @name 代理的配置
 * @see 在生产环境 代理是无法生效的，所以这里没有生产环境的配置
 * -------------------------------
 * The agent cannot take effect in the production environment
 * so there is no configuration of the production environment
 * For details, please see
 * https://pro.ant.design/docs/deploy
 *
 * @doc https://umijs.org/docs/guides/proxy
 */
export default {
  dev: {
    // 所有 /api/ 接口统一走 Java 后端（包括 admin 后台和公开认证）
    '/api/': {
      target: 'http://localhost:8081',
      changeOrigin: true,
    },

    // /ai-service/ 前缀直接代理到 ai-service（保留给 Copilot 等 AI 能力）
    '/ai-service/': {
      target: 'http://localhost:8000',
      changeOrigin: true,
      pathRewrite: { '^/ai-service': '' },
    },
  },
  test: {
    '/api/': {
      target: 'http://localhost:8081',
      changeOrigin: true,
    },
    '/ai-service/': {
      target: 'http://localhost:8000',
      changeOrigin: true,
      pathRewrite: { '^/ai-service': '' },
    },
  },
  pre: {
    '/api/': {
      target: 'your pre url',
      changeOrigin: true,
    },
    '/ai-service/': {
      target: 'your ai service url',
      changeOrigin: true,
      pathRewrite: { '^/ai-service': '' },
    },
  },
};
