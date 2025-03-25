## XML Sitemap

The application now includes an XML sitemap for improved search engine crawling:

- **Feature Flag**: `FEATURE_FLAG_USE_XML_SITEMAP` controls whether the sitemap is enabled
- **Access Points**: 
  - `/sitemap.xml` - Primary access point for search engines
  - `/api/sitemap.xml` - Secondary access point (API route)
- **Contents**: Includes homepage, main sections, and individual zodiac sign pages
- **Auto-updating**: Dates are dynamically updated based on the current date

To enable the sitemap:
1. Set `FEATURE_FLAG_USE_XML_SITEMAP=true` in your environment
2. Run `./scripts/toggle-sitemap.sh on` to enable across all config files
3. Verify it's working by accessing `/sitemap.xml` in your browser
4. Submit the sitemap URL to search engines via their webmaster tools

For more details, see [docs/seo/XML_SITEMAP.md](./docs/seo/XML_SITEMAP.md). 