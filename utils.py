import os
import json
from deep_translator import GoogleTranslator
from functools import lru_cache
from pinyin_tone_converter.pinyin_tone_converter import PinyinToneConverter
from dictionaries import *

translator = {}

pt_dict = PTDict("dictionary.json")
cedict = CEDict("cedict_ts.u8")

@lru_cache()
def translate(text, source, target):
    key = ",".join([source, target])
    if not key in translator.keys():
        translator[key] = GoogleTranslator(source=source, target=target)

    return translator[key].translate(text = text)

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

    pt_entries = pt_dict.search(query)
    en_entries = cedict.search(query)

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
