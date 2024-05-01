import os
import easyocr
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

@lru_cache()
def get_dictionary_for(query):
    entries = []

    for e in parsed_dict:
        if e["simplified"] == query or e["traditional"] == query:

            e["portuguese"] = translate(e["english"], "en", "pt")
            e["pinyin"] = PinyinToneConverter().convert_text(e["pinyin"])
            entries.append(e)

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
