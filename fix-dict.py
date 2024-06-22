import json

data = None

with open("dictionary.json", "r") as f:
    data = json.load(f)

for x in data:
    x["portuguese"] = x["portuguese"].replace("ﬁ ", "fi")
    x["portuguese"] = x["portuguese"].replace("ﬁ", "fi")

with open("dictionary-01.json", "w") as f:
    json.dump(data, f)
