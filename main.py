# TODO: Integrar na classe project uma instância de Watchdog, tal como acontece com AnkiFile
import os
import pinyin
import jieba
import json
from flask import Flask, render_template, request, jsonify, Response, redirect
from utils import *
from typing import List

from anki_utils import *
from protocol import *

_v = verbose

class Project:
    instances = {}

    def __new__(cls, name, *args, **kwargs):
        if name in cls.instances:
            return cls.instances[name]
        else:
            i = super().__new__(cls)
            cls.instances[name] = i
            return i

    def __del__(self):
        del Project.instances[self.name]

    def __init__(self, name, video_url):
        self.name = name
        self.anki_filepath = os.path.join(CONFIG.project_folder, name + ".txt")
        self.anki_file = AnkiFile(self.anki_filepath)

        self.json_filepath = os.path.join(CONFIG.project_folder, name + ".json")
        self.data = {
                "project_name":name,
                "video_url":video_url,
                }
        self.read()

    def write(self):
        with open(self.json_filepath, "w") as f:
            json.dump(self.data, f)

    def read(self):
        if not os.path.exists(self.json_filepath):
            self.write()
            return

        with open(self.json_filepath, "r") as f:
            self.data = json.load(f)

class CONFIG:
    target_dir = os.path.join(os.path.dirname(__file__), "target")
    project_folder = os.path.join(os.path.dirname(__file__), "projects")

class STATE:
    app = Flask(__name__)
    project = None
    timed_text = None

def fetch_once():
    if STATE.wg.fetch_once():
        STATE.project.append_chinese_text(STATE.wg.chinese)

@STATE.app.route("/get_started")
def get_started_page():
    return render_template("get_started.html")

@STATE.app.route("/")
def main_page():
    video_url = request.args.get("video_url")
    project_name = request.args.get("project_name")

    if not video_url or not project_name:
        return redirect("/get_started")

    if not STATE.project or project_name != STATE.project.name:
        STATE.project = Project(project_name, video_url)

    return render_template("main.html", video_url = video_url, project_name = project_name)

@STATE.app.get("/fetch_chinese")
def fetch_chinese():
    index = request.args.get("index")

    fetch_once();

    if not index:
        return jsonify(STATE.project.copy_chinese_text_list())

    index = int(index)

    return STATE.project.get_chinese_text(index)

@STATE.app.get("/change_chinese")
def change_chinese():
    index = request.args.get("index")
    new = request.args.get("new")

    try:
        index = int(index)

        if STATE.project.get_chinese_text(index) == new:
            return "A alteração não foi feita pois os valores novos e antigos coicidem"

        STATE.project.change_chinese_text(index, new)

    except Exception as e:
        return str(e)
    else:
        return ""

@STATE.app.get("/dictionary")
def dictionary():
    query = request.args.get("query")
    entries = get_dictionary_for(query)
    return jsonify(entries)

def default_return(function, *args, **kwargs):
    data = None
    try:
        data = function(*args, **kwargs)
    except Exception as e:
        return unsuccessful_answer(str(e))
    else:
        return successful_answer(data)

@STATE.app.post("/translate")
def translate_():
    source = request.json["sourceLanguage"]
    target = request.json["targetLanguage"]
    text = request.json["text"]

    return default_return(translate, text, source, target)

@lru_cache()
def cut_chinese_string(text):
    return list(jieba.cut(text))

@STATE.app.post("/cut_chinese_string")
def _cut_chinese_string():
    text = request.json
    return default_return(cut_chinese_string, text)

@STATE.app.post("/pinyin")
def pinyin_():
    text = request.json
    return default_return(pinyin.get, text)

class Cards:
    def replace_anki_card(request, card_id):
        new_card = AnkiCard(request.json)
        STATE.project.anki_file.replace_card(card_id, new_card)

    @STATE.app.get("/json_cards")
    def get_cards():
        return successful_answer(STATE.project.anki_file.get_json_compatible_cards())

    @STATE.app.post("/addcard")
    def addcard():
        card = AnkiCard(request.json)
        return default_return(STATE.project.anki_file.add_card, card)

    @STATE.app.route("/card/<int:card_id>", methods=["POST", "DELETE"])
    def card_route(card_id):
        if request.method == "POST":
            return default_return(Cards.replace_anki_card, request, card_id)

        if request.method == "DELETE":
            return default_return(STATE.project.anki_file.delete_card, card_id)

@STATE.app.route("/timedtext", methods=["POST", "GET"])
def timedtext():
    if request.method == "POST":
        STATE.timed_text = request.json
        return successful_answer()

    if request.method == "GET":
        return successful_answer(STATE.timed_text)


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
