import re
import json
from pypdf import PdfReader
PAG_START = 119 + 6
PAG_END = 228 + 6

def contains_hanzi(s):
    return re.findall('[\u4e00-\u9fff]+', s)

reader = PdfReader("dict.pdf")

entries = []

for i in range(PAG_START, PAG_END):
    pag = reader.pages[i]
    text = pag.extract_text()
    lines = text.split("\n")

    entry = {}
    entry_name = ""

    for l in lines:
        words = l.split(" ")
        chanzi = contains_hanzi(words[0])

        if len(chanzi) == 1 and \
                chanzi[0] == words[0]:
                    if entry:
                        entries.append(entry)
                    entry_name = words[0]
                    entry = {}
                    entry["simplified"] = entry_name
                    entry["pinyin"] = words[1]
                    entry["portuguese"] = "".join(words[2:]) 
        elif entry_name:
            if "Dicionario Portugues-Chines-book.indb" not in l:
                entry["portuguese"] += l

    if entry:
        entries.append(entry)

with open("dict.json", "w") as f:
    json.dump(entries, f)
