import csv
from itertools import chain

gxgList = []
with open('gxgFinal.csv', newline='') as csvfile:
    reader = csv.reader(csvfile, delimiter=',')
    for row in reader:
        gxgList.append(row)

diamondList = []
with open('diamondFinal.csv', newline='') as csvfile:
    reader = csv.reader(csvfile, delimiter=',')
    for row in reader:
        diamondList.append(row)

whaleList = []
with open('whaleFinal.csv', newline='') as csvfile:
    reader = csv.reader(csvfile, delimiter=',')
    for row in reader:
        whaleList.append(row)

holderList = []
with open('holderFinal.csv', newline='') as csvfile:
    reader = csv.reader(csvfile, delimiter=',')
    for row in reader:
        holderList.append(row)

# Convert a list to a dictionary
def listToDict(_list): 
    _dict = {_list[i]: _list[i + 1] for i in range(0, len(_list), 2)}
    return _dict

# Flatten list of list in to single list
def flatten(_list):
    flatList = list()
    for subList in _list:
        flatList += subList
    return flatList

# Merge 2 dicts into a single dict summing the values of each individual dict
def mergeDicts(x, y):
    _res = {k: int(x.get(k, 0)) + int(y.get(k, 0)) for k in set(x) | set(y)}
    return _res

# Merge the 4 imported dicts into a single dict
def main():
    gxgDict = listToDict(flatten(gxgList))
    diamondDict = listToDict(flatten(diamondList))
    whaleDict = listToDict(flatten(whaleList))
    holderDict = listToDict(flatten(holderList))

    # Merge the first 2 dicts
    masterDict = mergeDicts(gxgDict, diamondDict)

    # Merge the third dict into the first 2
    masterDict = mergeDicts(masterDict, whaleDict)

    # Merge the fourth dict into the first 3
    masterDict = mergeDicts(masterDict, holderDict)

    # Transform the dict into a list of lists
    masterList = []
    for key, value in iter(masterDict.items()):
        masterList.append([key, value])

    # output the result to file
    with open("airdropMaster.csv", "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerows(masterList)

# run the script
main()
