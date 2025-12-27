#!/bin/bash
# This script creates placeholder icons for the mini program
# Run this script after installing ImageMagick: apt-get install imagemagick

# Create simple colored placeholder icons (81x81 pixels)
# Home icon - house shape
convert -size 81x81 xc:transparent -fill '#999999' -draw "polygon 40,10 10,35 10,70 70,70 70,35" home.png
convert -size 81x81 xc:transparent -fill '#4A90D9' -draw "polygon 40,10 10,35 10,70 70,70 70,35" home-active.png

# Records icon - document shape
convert -size 81x81 xc:transparent -fill '#999999' -draw "rectangle 15,10 65,70" records.png
convert -size 81x81 xc:transparent -fill '#4A90D9' -draw "rectangle 15,10 65,70" records-active.png

# Profile icon - person shape
convert -size 81x81 xc:transparent -fill '#999999' -draw "circle 40,25 40,15" -draw "ellipse 40,70 25,20 0,180" profile.png
convert -size 81x81 xc:transparent -fill '#4A90D9' -draw "circle 40,25 40,15" -draw "ellipse 40,70 25,20 0,180" profile-active.png

echo "Icons created successfully!"
