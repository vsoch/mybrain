#/usr/bin/sh

images=roi*.png

for i in $images
do
   :
  convert $i -rotate 90 $i

done




