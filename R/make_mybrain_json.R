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

make_mybrain_json = function(meta,data,thresh,output_data_file,output_file_prefix) {

# output file
meta = read.csv(meta,sep="\t",head=FALSE,stringsAsFactors=FALSE)
data = read.table(data,sep=" ")
colnames(meta) = c("order","old_order","x","y","z","hemisphere","network","network_id")

# The column names just need to be numbers from 1..N, again, this should correspond to
# row names
colnames(data) = gsub("V","",colnames(data))

# Threshold the matrix
thresholded = data

pos = as.matrix(data)
neg = as.matrix(data)
pos[data < 0] = 0
neg[data > 0] = 0

# Try getting quantiles for top and bottom
qpos = quantile(pos,thresh)
qneg = quantile(abs(neg),thresh)

# From Russ: If there are very few nonzero connections (such as for afterscan.Anxiety) if the threshold is relatively loose (like 5%), which implies somethign like 10K connections, then there will be many fewer actual connections in the adjacency matrix than it would take to achieve that density. In that case I think the quantille function will just return zero, so that you can just threshold by the value returned by quantile and you should be fine. let me know if that makes sense.

pos[pos < qpos] = 0
neg[neg > (-1*qneg)] = 0

thresholded = pos + neg

# The correct image numbers should correspond to the old order number
image = paste("roi",formatC(meta$old_order, width=3, flag="0"),".png",sep="")
meta$image = image

# These colors are from the Peterson lab - we don't use them, but I'm keeping them here in case we want them.
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
# x = fit$points[,1]
# y = fit$points[,2]
# plot(x, y, xlab="Coordinate 1", ylab="Coordinate 2", main="Metric MDS",pch=19,col="orange")
# text(x, y, labels = meta$network, cex=.7) 

# The "+" does weird things in the browser
meta$network = gsub("[+]","",meta$network)

# NODE FILE -----------------------------
node_file = paste(output_file_prefix,"_nodes.csv",sep="")
cat(file=node_file,"x","y","z","hemisphere","network","network_id","image","mdsx","mdsy","color",sep=",")
cat(file=node_file,"\n",append=TRUE)

for (dd in 1:nrow(meta)){
  cat("Processing",dd,"of",nrow(meta),"\n")
  # First let's find its connections
  parcel1 = meta[dd,c(3,4,5,6,7,8,9)]
  x1 = round(x[dd],3)
  y1 = round(y[dd],3)
  color1 = color_vector[dd]
  vector = c(parcel1,x1,y1,color1)
  cat(unlist(vector),file=node_file,sep=",",append=TRUE)
  cat(file=node_file,"\n",append=TRUE)
}

# DATA FILE -----------------------------
# For each connection, add to data table
# Set upper diagonal to zero
thresholded[upper.tri(thresholded,diag=TRUE)] = 0

data_file = paste(output_file_prefix,"_data.csv",sep="")
cat(file=data_file,"x1","y1","z1","hemisphere1","network1","network_id1","image1","mdsx1","mdsy1","color1","x2","y2","z2","hemisphere2","network2","network_id2","image2","mdsx2","mdsy2","color2","corr",sep=",")
cat(file=data_file,"\n",append=TRUE)

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
    cat(unlist(vector),file=data_file,sep=",",append=TRUE)
    cat(file=data_file,"\n",append=TRUE)
  }
}
