<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet
  version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
  xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"
  exclude-result-prefixes="sitemap xhtml image video"
>
  <xsl:output method="html" encoding="UTF-8" indent="yes" />

  <xsl:template match="/">
    <html lang="en">
      <head>
        <title>Onetime Secret XML Sitemap</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content="noindex" />
        <style>
          :root {
            --primary: #3b82f6;
            --text-main: #1e293b;
            --text-secondary: #4b5563;
            --bg-main: #f8fafc;
            --bg-secondary: #ffffff;
            --border: #e2e8f0;
          }

          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }

          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
              "Helvetica Neue", Arial, sans-serif;
            line-height: 1.5;
            color: var(--text-main);
            background: var(--bg-main);
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem 1rem;
          }

          a {
            color: var(--primary);
            text-decoration: none;
          }

          a:hover {
            text-decoration: underline;
          }

          .container {
            background: var(--bg-secondary);
            border-radius: 0.5rem;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
            padding: 2rem;
            margin-bottom: 2rem;
          }

          h1 {
            font-size: 1.5rem;
            margin-bottom: 1rem;
            color: var(--text-main);
          }

          .info {
            margin-bottom: 1rem;
            font-size: 0.875rem;
            color: var(--text-secondary);
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 1rem;
            font-size: 0.875rem;
          }

          th {
            background-color: var(--bg-main);
            padding: 0.75rem 1rem;
            text-align: left;
            font-weight: 600;
            border-bottom: 2px solid var(--border);
          }

          td {
            padding: 0.75rem 1rem;
            border-bottom: 1px solid var(--border);
            vertical-align: top;
            line-height: 1.25rem;
          }

          .url-cell {
            max-width: 400px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .url-cell:hover {
            max-width: none;
            white-space: normal;
            word-break: break-all;
          }

          .alternates {
            list-style: none;
            margin-top: 0.5rem;
            font-size: 0.75rem;
          }

          .alternates li {
            margin-bottom: 0.25rem;
          }

          .alternates .label {
            display: inline-block;
            background: #e2e8f0;
            color: #4b5563;
            border-radius: 0.25rem;
            padding: 0.125rem 0.375rem;
            margin-right: 0.5rem;
          }

          .footer {
            margin-top: 2rem;
            font-size: 0.75rem;
            color: var(--text-secondary);
            text-align: center;
          }

          @media (max-width: 768px) {
            td, th {
              padding: 0.5rem;
            }

            .hidden-mobile {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Onetime Secret XML Sitemap</h1>
          <p class="info">
            This is an XML sitemap, meant for consumption by search engines.<br/>
            For more information about XML sitemaps, please visit <a href="https://sitemaps.org/" target="_blank" rel="noopener">sitemaps.org</a>.
          </p>

          <xsl:choose>
            <!-- sitemap index -->
            <xsl:when test="sitemap:sitemapindex">
              <p class="info">
                This XML Sitemap Index file contains <xsl:value-of select="count(sitemap:sitemapindex/sitemap:sitemap)"/> sitemaps.
              </p>
              <table>
                <thead>
                  <tr>
                    <th>URL</th>
                  </tr>
                </thead>
                <tbody>
                  <xsl:for-each select="sitemap:sitemapindex/sitemap:sitemap">
                    <tr>
                      <td>
                        <a href="{sitemap:loc}">
                          <xsl:value-of select="sitemap:loc" />
                        </a>
                      </td>
                    </tr>
                  </xsl:for-each>
                </tbody>
              </table>
            </xsl:when>

            <!-- regular sitemap -->
            <xsl:otherwise>
              <p class="info">
                This XML Sitemap contains <xsl:value-of select="count(sitemap:urlset/sitemap:url)"/> URLs.
              </p>
              <table>
                <thead>
                  <tr>
                    <th>URL</th>
                    <th class="hidden-mobile">Alternates</th>
                  </tr>
                </thead>
                <tbody>
                  <xsl:for-each select="sitemap:urlset/sitemap:url">
                    <tr>
                      <td class="url-cell">
                        <a href="{sitemap:loc}">
                          <xsl:value-of select="sitemap:loc" />
                        </a>
                      </td>
                      <td class="hidden-mobile">
                        <xsl:if test="xhtml:link">
                          <ul class="alternates">
                            <xsl:for-each select="xhtml:link">
                              <li>
                                <span class="label">
                                  <xsl:value-of select="@hreflang"/>
                                </span>
                                <a href="{@href}">
                                  <xsl:value-of select="@href" />
                                </a>
                              </li>
                            </xsl:for-each>
                          </ul>
                        </xsl:if>
                      </td>
                    </tr>
                  </xsl:for-each>
                </tbody>
              </table>
            </xsl:otherwise>
          </xsl:choose>
        </div>

        <div class="footer">
          Generated by Onetime Secret sitemap generator
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
