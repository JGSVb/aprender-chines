import os
import json
from deep_translator import GoogleTranslator
from parser import parsed_dict
from functools import lru_cache
from pinyin_tone_converter.pinyin_tone_converter import PinyinToneConverter

translator = {}

@lru_cache()
def translate(text, source, target):
    key = ",".join([source, target])
    if not key in translator.keys():
        translator[key] = GoogleTranslator(source=source, target=target)

    return translator[key].translate(text = text)


class PTDict:

    @staticmethod
    def select_func_contains(query, e):
        return query in e["chinese"]

    @staticmethod
    def key_func_eq(query, e):
        if e["chinese"] == query:
            return 0

        return 99999

    def __init__(self, filename):

        self.data = None
        self.filename = filename

        with open(self.filename, "r") as file:
            self.data = json.load(file)

    @lru_cache()
    def search(self, query, select_func=select_func_contains, key_func=key_func_eq):
        result = []

        for e in self.data:
            if select_func(query, e):
                result.append(e)

        result.sort(key=lambda x: key_func(query, x))

        return result

PortugueseDict = PTDict("dictionary.json")

def normalize_dict_entry(entry):
    if "simplified" not in entry:
        entry["simplified"] = entry["chinese"]
        entry["traditional"] = entry["chinese"]

    if "english" not in entry:
        entry["english"] = ""
    if "portuguese" not in entry:
        entry["portuguese"] = translate(entry["english"], "en", "pt")

    if "1" in entry["pinyin"] or \
        "2" in entry["pinyin"] or \
        "3" in entry["pinyin"] or \
        "4" in entry["pinyin"]:
            entry["pinyin"] = PinyinToneConverter().convert_text(entry["pinyin"])

@lru_cache()
def get_dictionary_for(query, truncate=6):

    pt_entries = PortugueseDict.search(query)

    en_entries = []
    for e in parsed_dict:
        if query == e["simplified"]:
            en_entries.insert(0, e)
            continue

        if len(en_entries)+1 > truncate/2:
            continue

        if query in e["simplified"]:
            en_entries.append(e)
            continue

    entries = pt_entries
    entries.extend(en_entries)

    if len(entries) > truncate:
        t = entries[:truncate + 1]
        entries = t

    for e in entries:
        normalize_dict_entry(e)

    return entries

def verbose(f):
    def inner(*args, **kwargs):
        err = None
        ret = None

        try:
            ret = f(*args, **kwargs)
        except Exception as e:
            err = e

        print(ret, f.__name__, args, kwargs)

        if err:
            raise err
        return ret

    return inner
