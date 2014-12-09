#/usr/bin/sh

images=roi*.png

for i in $images
do
  :
   convert $i -rotate 180 $i
  
done

convert $i -flip $i

  



