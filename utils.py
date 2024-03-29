from deep_translator import GoogleTranslator
from parser import parsed_dict
from functools import lru_cache
import easyocr
import os

translator = {}

class Watchdog:
    def __init__(self, target_dir):
        self.target_dir = target_dir
        self.before = []
        self.actual= []
        self.reader = easyocr.Reader(['ch_sim',])

        self.has_content = False
        self.chinese = None

    def fetch_once(self):

        self.actual = os.listdir(self.target_dir)

        diff = [x for x in self.actual if x not in self.before]
        diff = [os.path.join(self.target_dir, x) for x in diff]
        diff = [x for x in diff if x.endswith(".png")]

        self.before = self.actual

        if not diff:
            return

        f = diff[-1]

        result = self.reader.readtext(f, detail = 0)
        result = "".join(result)
        result = result.replace(" ", "")

        self.chinese = result
        self.has_content = True


@lru_cache()
def translate(text, source, target):
    # return f"translate() temporáriamente desativada\n"
    key = ",".join([source, target])
    if not key in translator.keys():
        translator[key] = GoogleTranslator(source=source, target=target)

    return translator[key].translate(text = text)

@lru_cache()
def get_dictionary_for(query):
    entries = []

    for e in parsed_dict:
        if e["simplified"] == query or e["traditional"] == query or e["pinyin"] == query:

            e["portuguese"] = translate(e["english"], "en", "pt")
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
