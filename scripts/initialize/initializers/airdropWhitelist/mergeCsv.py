import os
import csv

from itertools import chain

# Load the directory as a list with each file in the directory appended as a sub-list
def loadDirectory(directoryName):
    directory = []
    for file in os.listdir(directoryName):
        fileList = []
        with open(os.path.join(directoryName, file), newline='') as f:
            reader = csv.reader(f, delimiter=',')
            for row in reader:
                fileList.append(row)
        directory.append(fileList)
    return directory

# Flatten list of lists into single list
def flatten(_list):
    flatList = list()
    for subList in _list:
        flatList += subList
    return flatList

# Convert a dictionary to a list of lists
def dictToList(dict):
    result = []
    for key, value in iter(dict.items()):
        result.append([key, value])
    return result

# Given a list of lists, group by the first entry in each sub-list and sum the second entry for
# each
def groupSum(input):
    tempDict = {}  
    for entry in input:
        if (str(entry[0]) == "" or str(entry[1]) == ""):
            continue
        if entry[0] in tempDict:
            tempDict[entry[0]] += int(entry[1])
        else:
            tempDict[entry[0]] = int(entry[1])

    output = dictToList(tempDict)
    return output

# Group-sum the files in directoryName and save the results to outputName
def main(directoryName, outputName):
    # Load the directory as a list of lists of lists
    directory = loadDirectory(directoryName)

    # Flatten the directory into a list of lists
    # where each sub-list is of the form [address, count]
    flatDirectory = flatten(directory)

    # Group by address and sum the count for each
    resultList = groupSum(flatDirectory)

    # output the result to file
    with open(outputName, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerows(resultList)

# run the script
main("airdropPaymentSplitter", "airdropPaymentSplitterMaster.csv")
