import requests
import json
import os
from bs4 import BeautifulSoup as BS

def extract_from_glosbe(link):
    req = requests.get(link)

    soup = BS(req.text, "html.parser")

    box = soup.select_one("section.bg-white")

    entries_elem = box.select("ul.pr-1 > li")

    entries = []

    for e in entries_elem:
        entry = e.select_one("div.flex-1 > div")
        example_elem = e.select("div > div > p")

        if len(example_elem) > 2:
            example_elem = example_elem[1:]

        meaning = entry.select_one("h3").getText().strip()

        part_of_speech_elem = entry.select("span > span")
        part_of_speech = None

        if part_of_speech_elem:
            part_of_speech = [x.getText().strip() for x in part_of_speech_elem]

        example = None
        example_translation = None

        if len(example_elem) >= 1:
            example = example_elem[0].getText().strip()

        if len(example_elem) >= 2:
            example_translation = example_elem[1].getText().strip()

        entries.append({
            "meaning": meaning,
            "part_of_speech": part_of_speech,
            "example": example,
            "example_translation": example_translation,
            })

    less_frequent_elem = box.select("div div ul li div ul li")
    less_frequent = [x.getText().strip() for x in less_frequent_elem]

    return {"entries": entries,
            "less_frequent": less_frequent}

class GlosbeDict:

    def __init__(self, dirname, source, target):
        self.dirname = dirname
        self.source = source
        self.target = target
        self.filename = os.path.join(self.dirname, f"{self.source}-{self.target}.json")
        self.data = []

        if not os.path.isdir(self.dirname):
            os.mkdir(self.dirname)

        if not os.path.isfile(self.filename):
            self.write()

        self.read()

    def get_link(self, query):
        link = "https://glosbe.com/{}/{}/{}"
        return link.format(self.source, self.target, query)

    def write(self):
        with open(self.filename, "w") as file:
            json.dump(self.data, file)

    def read(self):
        with open(self.filename, "r") as file:
            self.data = json.load(file)

    def search_data(self, query):
        for entry in self.data:
            if entry["query"] == query:
                return entry

        return None

    def append_entry(self, query : str, glosbe_entry):
        entry = {"query": query,
                "result": glosbe_entry}

        self.data.append(entry)
        self.write()

        return glosbe_entry

    def search(self, query):
        internal = self.search_data(query)

        if internal:
            return internal

        link = self.get_link(query)
        glosbe_entry = extract_from_glosbe(link)
        entry = self.append_entry(query, glosbe_entry)

        return entry

def main():
    d = GlosbeDict("glosbe", "zh", "pt")
    entry = d.search("金")
    print(entry)

if __name__ == "__main__":
    main()
