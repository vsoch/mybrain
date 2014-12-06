library(argosfilter)
R = 6371

# conversion from lat/long to xyz
#x = R * cos(lat) * cos(lon)
#y = R * cos(lat) * sin(lon)
#z = R *sin(lat)

lat = c()
long = c()
for (f in 1:length(test$features)){
  tmp = test$features[[f]]
  long = c(long,tmp$geometry$coordinates[1])
  lat = c(lat,tmp$geometry$coordinates[2])
}

latrange = c(-40,60)
longrange = c(-150,150)

# Here are ranges of latitude and longitude points
latrange = seq(-40,60,length.out=1000)
longrange = seq(-150,150,length.out=1000)

# Let's project points to 2D, normalize, and then put in ranges above
points = meta[,c(3,4,5)]
d = dist(points) # euclidean distances between the rows
fit = cmdscale(d,eig=TRUE, k=2) # k is the number of dim
fit # view results

# plot solution
x <- fit$points[,1]
y <- fit$points[,2]
plot(x, y, xlab="Coordinate 1", ylab="Coordinate 2",
  main="Metric MDS",pch=19,col="orange")
text(x, y, labels = meta$network, cex=.7) 

# Normalize x and y each between 0 and 1
xnorm = round((x - min(x)) / (max(x)-min(x)),2)
ynorm = round((y - min(y)) / (max(y)-min(y)),2)

# Now get points in the range of the latrange and longrange
longs = c()
lats = c()
for (p in 1:length(xnorm)){
  newx = longrange[xnorm[p] * 100]
  newy = latrange[ynorm[p] * 100]
  longs = c(longs,newx)
  lats = c(lats,newy)
}


