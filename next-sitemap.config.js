/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://onechatai.ai', 
  generateRobotsTxt: true, 
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/blog/wp-admin/',
          '/blog/wp-login.php',
          '/blog/wp-includes/',
          '/blog/xmlrpc.php',
          '/blog/?s=*',
          '/blog/*?replytocom=*',
          '/*?utm_*',
          '/*?sessionid=*',
        ],
      },
    ],
    additionalSitemaps: [
      'https://onechatai.ai/sitemap.xml',
      'https://onechatai.ai/blog/sitemap.xml',
    ],
  },
};
