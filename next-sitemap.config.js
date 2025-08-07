module.exports = {
  siteUrl: process.env.SITE_URL || "https://r-whiskey.vercel.app/",
  generateRobotsTxt: true,
  generateIndexSitemap: true,
  changefreq: "weekly",
  priority: 0.7,
  sitemapSize: 5000,
  exclude: ["/admin/*", "/private"],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/"
      }
    ],
    additionalSitemaps: []
  }
};
