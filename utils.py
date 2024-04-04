import os
import easyocr
import json
from deep_translator import GoogleTranslator
from parser import parsed_dict
from functools import lru_cache
from pinyin_tone_converter.pinyin_tone_converter import PinyinToneConverter

translator = {}

portuguese_dict = {}

with open("dict.json") as f:
    portuguese_dict = json.load(f)

@lru_cache()
def search_dict_portuguese(query):
    entries = []

    for e in portuguese_dict:
        if e["simplified"] == query:
            entries.append(e)

    return entries

class Watchdog:
    def __init__(self, target_dir):
        self.target_dir = target_dir
        self.before = []
        self.actual = []
        self.queue = []
        self.reader = easyocr.Reader(["ch_sim", "en"])

        self.chinese = None

    @lru_cache()
    def cached_reader(self, *args, **kwargs):
        return self.reader.readtext(*args, **kwargs)

    def build_queue(self):
        self.actual = os.listdir(self.target_dir)

        diff = [x for x in self.actual if x not in self.before]
        diff = [os.path.join(self.target_dir, x) for x in diff]
        diff = [x for x in diff if x.endswith(".png")]

        self.before = self.actual

        self.queue = diff
        self.queue.sort()

    def fetch_once(self) -> bool:

        if not self.queue:
            self.build_queue()

            if not self.queue:
                return False

        f = self.queue[0]
        self.queue.remove(f)

        result = self.cached_reader(f, detail = 0)
        result = "".join(result)
        result = result.replace(" ", "")

        self.chinese = result

        return True


@lru_cache()
def translate(text, source, target):
    # return f"translate() temporáriamente desativada\n"
    key = ",".join([source, target])
    if not key in translator.keys():
        translator[key] = GoogleTranslator(source=source, target=target)

    return translator[key].translate(text = text)

@lru_cache()
def get_dictionary_for(query):
    # entries = search_dict_portuguese(query)
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

class AnkiFile:
    instances = {}

    def __new__(cls, filepath):
        if filepath in cls.instances.keys():
            return cls.instances[filepath]
        else:
            i = super().__new__(cls)
            cls.instances[filepath] = i
            return i

    def __del__(self):
        del AnkiFile.instances[self.filepath]

    def __init__(self, filepath):
        filepath = os.path.abspath(filepath)
        self.filepath = filepath

        self.cards = []
        self.read()

    @staticmethod
    def prop_get_name(line):
        if line[0] != "#":
            return None, line

        name = ""
        i = 1
        while line[i] != ":":
            name += line[i]
            i += 1

        leftover = line[i:]

        return name, leftover

    @staticmethod
    def prop_get_value(line):
        if line[0] != ":":
            return None

        value = ""
        i = 1
        while line[i] != "\n":
            value += line[i]
            i += 1

        return value

    @staticmethod
    def read_prop(line):
        name, leftover = AnkiFile.prop_get_name(line)
        value = AnkiFile.prop_get_value(leftover)

        return name, value

    @staticmethod
    def props_are_supported(props):
        keys = props.keys()

        if len(keys) != 2:
            return False

        if not ("separator" in keys and "html" in keys):
            return False

        if props["separator"] == "tab" and props["html"] == "false":
            return True

        return False

    def get_cards_field(self, index):
        field = []

        for c in self.cards:
            field.append(c[index])

        return field

    def read(self):
        if not os.path.exists(self.filepath):
            self.write()
            return

        lines = []

        with open(self.filepath, "r") as f:
            lines = f.readlines()

        read_prop = True
        props = {}
        name = None
        value = None

        for l in lines:
            if read_prop:
                name, value = self.read_prop(l)

            if name == None:
                read_prop = False
                if not AnkiFile.props_are_supported(props):
                    raise Exception(f"As propriedades do ficheiro {self.filepath} não são suportadas ({props})")
            else:
                props[name] = value
                continue

            card = l.split("\t")
            # tirar \n do final
            card[-1] = card[-1][:-1]
            self.cards.append(card)

    def get_write_content(self):
        lines = [
                "#separator:tab\n",
                "#html:false\n"
                ]

        for c in self.cards:
            lines.append("\t".join(c)+"\n")

        return lines

    def add_card(self, a,b,c,d, write = False):
        f = self.get_cards_field(0)
        if a in f:
            raise Exception("Já existe uma carta cujo index=0 tem valor " + a)
        else:
            self.cards.append([a,b,c,d])

        if(write):
            self.write()

    def write(self):
        lines = self.get_write_content()

        with open(self.filepath, "w") as f:
            f.writelines(lines)
