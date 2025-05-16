/**
 * SEO utility functions for Onetime Secret.
 * Manages route-specific SEO configurations and breadcrumb generation.
 */

// --------------------------
// Interfaces
// --------------------------

export interface BreadcrumbItem {
  "@type": "ListItem";
  position: number;
  name: string;
  item: string;
}

export interface RouteSeoConfig {
  title: string;
  description: string;
  ogType?: string;
  ogImage?: string;
  structuredData?: object;
}

// --------------------------
// SEO Configuration Data
// --------------------------

/**
 * Retrieves the SEO configuration for a specific route.
 *
 * @param currentPath - The current URL path (e.g., "/", "/about").
 * @param origin - The origin of the site (e.g., "https://onetimesecret.com").
 * @returns The SEO configuration object for the route, or an empty object if not found.
 */
export function getRouteSeoConfig(
  currentPath: string,
  origin: string,
): Partial<RouteSeoConfig> {
  const routeConfigs: Record<string, RouteSeoConfig> = {
    "/": {
      title: "Onetime Secret - Share Sensitive Information Securely",
      description:
        "Share passwords, private messages, and sensitive information with secure, self-destructing links that can only be viewed once.",
      ogType: "website",
      ogImage: "/etc/img/social/onetimesecret-home-og.png",
      structuredData: {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "Onetime Secret",
        url: origin,
        applicationCategory: "SecurityApplication",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        description:
          "Share passwords, private messages, and sensitive information with secure, self-destructing links that can only be viewed once.",
      },
    },
    "/about": {
      title: "About Onetime Secret - Our Mission and Team",
      description:
        "Learn about Onetime Secret, our mission to provide secure one-time sharing, and the team behind this privacy-focused service.",
      ogImage: "/etc/img/social/onetimesecret-home-og.png", // Assuming same OG image, can be specified if different
      ogType: "article", // Or "website" - "AboutPage" is for structured data type
      structuredData: {
        "@context": "https://schema.org",
        "@type": "AboutPage",
        name: "About Onetime Secret",
        url: `${origin}/about`,
        description:
          "Learn about Onetime Secret, our mission to provide secure one-time sharing, and the team behind this privacy-focused service.",
      },
    },
    "/pricing": {
      title: "Onetime Secret Pricing - Free and Premium Plans",
      description:
        "Explore Onetime Secret pricing plans. Use our basic service for free or upgrade to premium for enhanced security features and longer expiration times.",
      ogImage: "/etc/img/social/onetimesecret-home-og.png", // Assuming same OG image
      ogType: "website", // Or "ProductGroup" if more appropriate
      structuredData: {
        "@context": "https://schema.org",
        "@type": "WebPage", // Using WebPage, as PriceSpecification is often part of a Product or Service
        name: "Onetime Secret Pricing",
        url: `${origin}/pricing`,
        mainEntity: { // Example of embedding PriceSpecification
            "@type": "Offer",
            name: "Onetime Secret Plans",
            description: "Explore Onetime Secret pricing plans with free and premium options.",
            priceSpecification: [ // Array if multiple plans shown
                {
                    "@type": "PriceSpecification",
                    name: "Free Tier",
                    price: "0",
                    priceCurrency: "USD",
                    description: "Basic service for free.",
                },
                // Add premium plan PriceSpecification if applicable
            ]
        }
      },
    },
    // Add other routes here as needed
  };
  return routeConfigs[currentPath] || {};
}

// --------------------------
// Breadcrumbs Generation
// --------------------------

/**
 * Generates breadcrumb structured data for the given path.
 *
 * @param path - The current URL path (e.g., "/about/team").
 * @param origin - The origin of the site (e.g., "https://onetimesecret.com").
 * @returns An array of breadcrumb items for JSON-LD.
 */
export function generateBreadcrumbs(
  path: string,
  origin: string,
): BreadcrumbItem[] {
  const segments = path.split("/").filter((segment) => segment);
  const breadcrumbs: BreadcrumbItem[] = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: origin,
    },
  ];

  let currentPathAccumulator = "";
  segments.forEach((segment, index) => {
    currentPathAccumulator += `/${segment}`;
    breadcrumbs.push({
      "@type": "ListItem",
      position: index + 2,
      name:
        segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " "),
      item: `${origin}${currentPathAccumulator}`,
    });
  });

  return breadcrumbs;
}

/**
 * Generates the complete BreadcrumbList structured data object.
 * @param path - The current URL path.
 * @param origin - The origin of the site.
 * @returns The BreadcrumbList structured data object.
 */
export function generateBreadcrumbsLd(path: string, origin: string): object {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: generateBreadcrumbs(path, origin),
    };
}

// Default SEO values, can be used as fallbacks in the layout
export const defaultSeoValues = {
  title: "Onetime Secret - Share Sensitive Information Securely",
  description:
    "Share passwords, private messages, and sensitive information with secure, self-destructing links that can only be viewed once.",
  ogType: "website",
  ogImage: "/etc/img/social/onetimesecret-home-og.png", // Relative path, to be resolved with origin
  twitterCard: "summary_large_image",
  keywords:
    "secure sharing, one-time links, self-destructing messages, secure passwords, private sharing",
};

/**
 * Generates a default structured data object for WebApplication.
 * @param origin - The origin of the site.
 * @param description - The description to use in the structured data.
 * @returns The default WebApplication structured data.
 */
export function getDefaultWebApplicationLd(origin: string, description: string): object {
    return {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "Onetime Secret",
        url: origin,
        applicationCategory: "SecurityApplication",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        description: description,
    };
}
// EOF newlines
