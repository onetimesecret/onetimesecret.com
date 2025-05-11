# Example Images for Onetime Secret

This directory contains various example images used throughout the Onetime Secret application, primarily for demonstration and visual context on the homepage and potentially other areas.

These images showcase different states or features of the application interface. They are intended for use within the application's frontend components.

## Usage

Reference these images using their relative paths from the `public` directory, e.g., `/examples/homepage.png`.

## Image Details

You can use the following command on macOS to list the dimensions and aspect ratios of the images:


```bash
for img in *.jpeg; do \
  sips -g pixelWidth -g pixelHeight "$img" | \
  awk -v filename="$img" '/pixelWidth/ {w=$2} /pixelHeight/ {h=$2; if (h>0) printf "%s: %.3f (w=%d, h=%d)\n", filename, w/h, w, h; else printf "%s: Invalid height (w=%d, h=%d)\n", filename, w, h;}'; \
done
```

Example output:

```bash
homepage-attemp1.png: 1.021 (w=1058, h=1036), Mean Brightness: 145.27
homepage-attempt4.png: 0.628 (w=1189, h=1892), Mean Brightness: 207.90
homepage-attempt5.png: 0.628 (w=1189, h=1892), Mean Brightness: 207.36
homepage-expanded.png: 0.920 (w=1954, h=2124), Mean Brightness: 251.44
homepage.png: 0.935 (w=1970, h=2108), Mean Brightness: 250.68
screenshot-custom-domain.png: 1.078 (w=2470, h=2292), Mean Brightness: 142.76
custom-domain-eu-1.jpeg: 1.079 (w=2488, h=2306), Mean Brightness: 30.57
custom-domain-eu-2.jpeg: 1.079 (w=2488, h=2306), Mean Brightness: 29.87
custom-domain-eu-3.jpeg: 0.974 (w=2488, h=2554), Mean Brightness: 30.90
custom-domain-eu-4.jpeg: 0.891 (w=2488, h=2792), Mean Brightness: 30.19
custom-domain-eu-5.jpeg: 0.974 (w=2488, h=2554), Mean Brightness: 251.42
custom-domain-eu.jpeg: 1.083 (w=2488, h=2298), Mean Brightness: 251.21
custom-domain-nz-1.jpeg: 0.982 (w=2488, h=2534), Mean Brightness: 249.50
custom-domain-nz.jpeg: 0.945 (w=2488, h=2634), Mean Brightness: 31.19
custom-domain-us-1.jpeg: 1.083 (w=2488, h=2298), Mean Brightness: 29.46
custom-domain-us-2.jpeg: 1.083 (w=2488, h=2298), Mean Brightness: 251.49
custom-domain-us-3.jpeg: 1.083 (w=2488, h=2298), Mean Brightness: 29.44
custom-domain-us-4.jpeg: 0.974 (w=2488, h=2554), Mean Brightness: 252.09
custom-domain-us-5.jpeg: 0.974 (w=2488, h=2554), Mean Brightness: 252.96
custom-domain-us-6.jpeg: 0.855 (w=2488, h=2910), Mean Brightness: 249.67
custom-domain-us.jpeg: 1.079 (w=2488, h=2306), Mean Brightness: 251.31
```
