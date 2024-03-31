import os
import pinyin
import jieba
import json
from flask import Flask, render_template, request, jsonify, Response, redirect

"""
from deep_translator import (GoogleTranslator,
                             ChatGptTranslator,
                             YandexTranslator,
                             BaiduTranslator)
"""

from utils import *

_v = verbose

class Project:
    instances = {}

    def __new__(cls, name):
        if name in cls.instances:
            return cls.instances[name]
        else:
            i = super().__new__(cls)
            cls.instances[name] = i
            return i

    def __del__(self):
        del Project.instances[self.name]

    def __init__(self, name):
        self.name = name
        self.anki_filepath = os.path.join(CONFIG.project_folder, name + ".txt")
        self.anki_file = AnkiFile.from_filepath(self.anki_filepath)

        self.json_filepath = os.path.join(CONFIG.project_folder, name + ".json")
        self.data = {
                "chinese_text":[]
                }
        self.read()

    def add_card(self, a,b,c,d, write = True):
        return self.anki_file.add_card(a,b,c,d,write)

    def write(self):
        with open(self.json_filepath, "w") as f:
            json.dump(self.data, f)

    def read(self):
        if not os.path.exists(self.json_filepath):
            self.write()
            return

        with open(self.json_filepath, "r") as f:
            self.data = json.load(f)

    def append_chinese_text(self, text, write = True):
        if(not self.data["chinese_text"]):
            self.data["chinese_text"].append(text)
        elif(self.data["chinese_text"][-1] != text):
            self.data["chinese_text"].append(text)

        if write:
            self.write()

    def get_chinese_text_length(self):
        return len(self.data["chinese_text"])

    def get_chinese_text(self, age, safe = True):
        if not self.data["chinese_text"]:
            return ""

        rev = self.data["chinese_text"].copy()
        rev.reverse()

        if safe:
            if age > len(rev) - 1:
                return rev[-1]

        return rev[age]


class CONFIG:
    target_dir = os.path.join(os.path.dirname(__file__), "target")
    project_folder = os.path.join(os.path.dirname(__file__), "projects")

class STATE:
    app = Flask(__name__)
    wg = None 
    project = None

@STATE.app.route("/get_started")
def get_started_page():
    return render_template("get_started.html")

@STATE.app.route("/")
def main_page():
    video_url = request.args.get("video_url")
    project_name = request.args.get("project_name")

    if not video_url or not project_name:
        return redirect("/get_started")

    STATE.project = Project(project_name)
    STATE.wg = Watchdog(CONFIG.target_dir)

    return render_template("main.html", video_url = video_url, project_name = project_name)

@STATE.app.get("/fetch_chinese")
def fetch_chinese():
    age = request.args.get("age")
    age = int(age)

    if STATE.wg.fetch_once():
        print(STATE.wg.chinese)
        STATE.project.append_chinese_text(STATE.wg.chinese)

    return STATE.project.get_chinese_text(age)

@STATE.app.get("/pinyin")
def pinyin_():
    text = request.args.get("chinese")
    return pinyin.get(text)

@STATE.app.get("/words")
def split_words():
    text = request.args.get("chinese")
    return jsonify(list(jieba.cut(text)))

@STATE.app.get("/translate")
def translate_():
    text = request.args.get("text")
    way = request.args.get("way")
    source, target = way.split(",")
    return translate(text, source, target)

@STATE.app.get("/dictionary")
def dictionary():
    query = request.args.get("query")
    entries = get_dictionary_for(query)
    return jsonify(entries)

@STATE.app.get("/anki_routine")
def anki_routine():
    question_a = request.args.get("question_a")
    question_b = request.args.get("question_b")
    awnser = request.args.get("awnser")
    meaning = request.args.get("meaning")

    if None in (question_a, question_b, awnser, meaning):
        return "Faltam campos"

    STATE.project.add_card(question_a, question_b, awnser, meaning)
    return ""


def clean():

    for file in os.listdir(CONFIG.target_dir):
        path = os.path.join(CONFIG.target_dir, file)
        os.rename(path, path+"_")

def main():
    _v(os.makedirs)(CONFIG.target_dir, exist_ok=True)
    _v(os.makedirs)(CONFIG.project_folder, exist_ok=True)

    clean()

    STATE.app.run(debug=True)

if __name__ == "__main__":
    main()
