# run_make_connections_json will iterate over Russ data directories, and make an output json for each one
# for a d3 visualization!

# ouput_folder: where you want to save the json files, should be in web/data directory of myconnectome
# input_folder: should be the folder filled with subfolders, each containing a parcel data and meta data file
# data file should have some common name, as well as parcel file

output_folder = "/home/vanessa/Documents/Dropbox/Website/mybrain/web/data"
input_folder = "/home/vanessa/Documents/Dropbox/Website/mybrain/data"
data_file = "data_unspaced.txt"
parcel_file = "parcel_info_unspaced.txt"
threshold = 0.99

subfolders = list.files(input_folder,full.names=TRUE)
source("make_mybrain_json.R")

for (folder in subfolders) {
  data = paste(folder,"/",data_file,sep="")
  meta = paste(folder,"/",parcel_file,sep="")
  folder_name = strsplit(folder,"/")[[1]]
  folder_name = tolower(folder_name[length(folder_name)])
  output_file_prefix = paste(output_folder,"/",folder_name,sep="")
  make_mybrain_json(meta,data,threshold,output_file_prefix)
}


