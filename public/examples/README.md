# Example Images for Onetime Secret

This directory contains various example images used throughout the Onetime Secret application, primarily for demonstration and visual context on the homepage and potentially other areas.

These images showcase different states or features of the application interface. They are intended for use within the application's frontend components.

## Usage

Reference these images using their relative paths from the `public` directory, e.g., `/examples/homepage.png`.

## Image Details

You can use the following command on macOS to list the dimensions and aspect ratios of the images:


```bash
  for img in *.png; do \
    sips -g pixelWidth -g pixelHeight "$img" | \
    awk -v filename="$img" '/pixelWidth/ {w=$2} /pixelHeight/ {h=$2; if (h>0) printf "%s: %.3f (w=%d, h=%d)\n", filename, w/h, w, h; else printf "%s: Invalid height (w=%d, h=%d)\n", filename, w, h;}'; \
  done
```

Example output:

```bash
homepage-attemp1.png: 1.021 (w=1058, h=1036)
homepage-attempt4.png: 0.628 (w=1189, h=1892)
homepage-attempt5.png: 0.628 (w=1189, h=1892)
homepage-expanded.png: 0.920 (w=1954, h=2124)
homepage-slice-taglines.png: 3.481 (w=825, h=237)
homepage-slice-top.png: 7.074 (w=962, h=136)
homepage.png: 0.935 (w=1970, h=2108)
```
