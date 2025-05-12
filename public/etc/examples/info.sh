#!/bin/bash

# Check if ImageMagick's convert command is available
if ! command -v convert &> /dev/null
then
    echo "ImageMagick 'convert' command could not be found. Please install ImageMagick."
    exit 1
fi

# Iterate over common image file types in the current directory
for img in *.png *.jpeg *.jpg; do
  # Check if the file exists
  if [ ! -f "$img" ]; then
    continue
  fi

  # Get dimensions and aspect ratio using sips
  dimensions_info=$(sips -g pixelWidth -g pixelHeight "$img" | \
    awk '/pixelWidth/ {w=$2} /pixelHeight/ {h=$2; if (h>0) printf "%.3f (w=%d, h=%d)", w/h, w, h; else printf "Invalid height (w=%d, h=%d)", w, h;}')

  # Get mean brightness using ImageMagick
  # convert "$img" -colorspace Gray: Converts the image to grayscale for luminance calculation.
  # -format "%[fx:mean*255]": Calculates the mean pixel value (normalized 0-1)
  #                            and scales it to the 0-255 range.
  # info:: Outputs the result.
  mean_brightness=$(convert "$img" -colorspace Gray -format "%[fx:mean*255]" info: 2>/dev/null)

  # Check if mean_brightness was successfully calculated
  if [[ -z "$mean_brightness" || "$mean_brightness" == "N/A" ]]; then
    mean_brightness_formatted="N/A"
  else
    # Format to two decimal places
    mean_brightness_formatted=$(printf "%.2f" "$mean_brightness")
  fi

  # Print combined information for the image
  printf "%s: %s, Mean Brightness: %s\n" "$img" "$dimensions_info" "$mean_brightness_formatted"
done
