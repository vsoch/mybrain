# make_mybrain_json.R
# Make mybrain input data json for d3 visualization!

# INPUT
# meta: a tab separated file of meta data
#	- "order" should specifiy the ordering of the nodes in the circle
#	- "label" should correspond to the label to be positioned around the circle
#	- "group" should correspond to the group name
#	- "image" should correspond to the image name to be shown for the node
#       - all other variables are ignored.  This can be changed if needed.
#
# correlation: a tab separated correlation matrix, with row and column labels equivalent to the "label" variable in the meta "label" field.  This matrix will
# be converted to Z scores to get the top / bottom of 95th percentile of connections
#
# vsochat[at]stanford.edu
# for PoldrackLab MyBrain

# Let's try for this format
# direction,value,region1,region2
# date,delay,distance,origin,destination
# 01010001,14,405,MCI,MDW
# 01010530,-11,370,LAX,PHX
# 01010540,5,389,ONT,SMF
# 01010600,-5,337,OAK,LAX
# 01010600,3,303,MSY,HOU
# 01010605,5,236,LAS,LAX
 

make_mybrain_json = function(meta,data,output_data_file,output_node_file) {

# output file
meta = read.csv(meta,sep="\t",head=FALSE,stringsAsFactors=FALSE)
data = read.table(data,sep=" ")
colnames(meta) = c("order","old_order","x","y","z","hemisphere","network","network_id")

# The column names just need to be numbers from 1..N, again, this should correspond to
# row names
colnames(data) = gsub("V","",colnames(data))

# We are not thresholding the matrix :)
thresholded = data

# The correct image numbers should correspond to the old order number
image = paste("roi",formatC(meta$old_order, width=3, flag="0"),".png",sep="")
meta$image = image

# the group label should indicate the hemisphere AND network name - NOT just the network,
# otherwise left and right will be clumped together, and we want them separate (lateral)
groups = paste(meta$hemisphere,meta$network_id,sep="-")

# Finally... the colors!  These colors are from the Peterson lab - we don't use them, but I'm keeping them here in case we want them.
color_labels = c("Default","Second-Dorsal-Attention","Ventral-Attention-Language","Second-Visual","Frontal-Parietal","Somatomotor","none","Parietal-Episodic-Retrieval","Parieto-Occipital","Cingulo-opercular","Salience","Frontal-Parietal-Other","First-Dorsal-Attention","First-Visual-V1+","Subcortical")
colors = c("#ff2700","#d6add6","#007d7d","#393FAC","#FFFB00","#00ffff","94CD54","#CC0066","#003eff","#fbfbda","#822082","#000000","#c46b8b","#00f700","#94cd54","#CC0066")

# Prepare a vector of colors base on the network name.
names(colors) = color_labels

# Add colors to network
color_vector = c()
for (m in 1:nrow(data)){
  color_vector = c(color_vector,colors[as.character(meta$network[m])])    
}

# Let's project points to 2D, normalize, and then put in ranges above
points = meta[,c(3,4,5)]
d = dist(points) # euclidean distances between the rows
fit = cmdscale(d,eig=TRUE, k=2) # k is the number of dim
fit # view results

# plot solution
x = fit$points[,1]
y = fit$points[,2]
plot(x, y, xlab="Coordinate 1", ylab="Coordinate 2",
  main="Metric MDS",pch=19,col="orange")
text(x, y, labels = meta$network, cex=.7) 

# First let's make a file of just the unique nodes

# The "+" does weird things in the browser
meta$network = gsub("[+]","",meta$network)

# NODE FILE -----------------------------
cat(file=output_node_file,"x","y","z","hemisphere","network","network_id","image","mdsx","mdsy","color",sep=",")
cat(file=output_file,"\n",append=TRUE)

for (dd in 1:nrow(meta)){
  cat("Processing",dd,"of",nrow(meta),"\n")
  # First let's find its connections
  parcel1 = meta[dd,c(3,4,5,6,7,8,9)]
  x1 = round(x[dd],3)
  y1 = round(y[dd],3)
  color1 = color_vector[dd]
  vector = c(parcel1,x1,y1,color1)
  cat(unlist(vector),file=output_file,sep=",",append=TRUE)
  cat(file=output_file,"\n",append=TRUE)
}

# DATA FILE -----------------------------
# For each connection, add to data table
cat(file=output_data_file,"x1","y1","z1","hemisphere1","network1","network_id1","image1","mdsx1","mdsy1","color1","x2","y2","z2","hemisphere2","network2","network_id2","image2","mdsx2","mdsy2","color2","corr",sep=",")
cat(file=output_file,"\n",append=TRUE)

for (dd in 1:nrow(meta)){
  cat("Processing",dd,"of",nrow(meta),"\n")
  # First let's find its connections
  connection_idx = which(thresholded[dd,]!=0)
  parcel1 = meta[dd,c(3,4,5,6,7,8,9)]
  x1 = round(x[dd],3)
  y1 = round(y[dd],3)
  color1 = color_vector[dd]
  # For each connection, we need to write a line to file
  for (c in 1:length(connection_idx)) {
    cc = connection_idx[c]
    parcel2 = meta[cc,c(3,4,5,6,7,8,9)]
    color2 = color_vector[cc]
    strength = round(thresholded[dd,cc],3)
    x2 = round(x[cc],3)
    y2 = round(y[cc],3)
    vector = c(parcel1,x1,y1,color1,parcel2,x2,y2,color2,strength)
    cat(unlist(vector),file=output_file,sep=",",append=TRUE)
    cat(file=output_file,"\n",append=TRUE)
  }
}