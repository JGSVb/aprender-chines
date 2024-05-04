import os
import pinyin
import jieba
from urllib.parse import urlparse, parse_qs
from flask import Flask, render_template, request, jsonify, Response, redirect
from utils import *
from typing import List

from anki_utils import *
from project import *
from protocol import *

_v = verbose

proj_conf = ProjectConfig("Projetos")
Project.configure(proj_conf)

class STATE:
    app = Flask(__name__)
    timedtext = None
    timedtext_url = None

def get_youtube_video_id(youtube_video_url):
    query = urlparse(youtube_video_url).query
    return parse_qs(query)["v"][0]

@STATE.app.get("/")
def main_page():
    return render_template("get_started.html", projects = Project.get_projects())

@STATE.app.get("/project/<project_name>")
def projects(project_name):
    Project.open_project(name = project_name)
    video_url = Project.current().video_url
    video_id = get_youtube_video_id(video_url)
    return render_template("main.html", video_url=video_url, video_id=video_id, project_name=project_name)

@STATE.app.post("/create_project")
def create_project():
    video_url = request.form["video_url"]
    project_name = request.form["project_name"]

    video_id = get_youtube_video_id(video_url)
    Project.create_project(name = project_name, video_url = video_url)
    return render_template("main.html", video_url = video_url, video_id = video_id, project_name = project_name)

@STATE.app.get("/dictionary")
def dictionary():
    query = request.args.get("query")
    entries = get_dictionary_for(query)
    return jsonify(entries)

@STATE.app.post("/translate")
@response_func
def translate_():
    source = request.json["sourceLanguage"]
    target = request.json["targetLanguage"]
    text = request.json["text"]

    return translate(text, source, target)

@lru_cache()
def cut_chinese_string(text):
    return list(jieba.cut(text))

@STATE.app.post("/cut_chinese_string")
@response_func
def _cut_chinese_string():
    text = request.json
    return cut_chinese_string(text)

@STATE.app.post("/pinyin")
@response_func
def pinyin_():
    text = request.json
    return pinyin.get(text)

class Cards:
    def replace_anki_card(request, card_id):
        new_card = AnkiCard(request.json)
        Project.current().anki_file.replace_card(card_id, new_card)

    @STATE.app.get("/json_cards")
    def get_cards():
        return successful_answer(Project.current().anki_file.get_json_compatible_cards())

    @STATE.app.post("/addcard")
    @response_func
    def addcard():
        card = AnkiCard(request.json)
        return Project.current().anki_file.add_card(card)

    @STATE.app.route("/card/<int:card_id>", methods=["POST", "DELETE"])
    @response_func
    def card_route(card_id):
        if request.method == "POST":
            return Project.current().anki_file.replace_card(request, card_id)

        if request.method == "DELETE":
            return Project.current().anki_file.delete_card(card_id)

@STATE.app.route("/timedtext", methods=["POST", "GET"])
@response_func
def timedtext():
    if request.method == "POST":
        url = request.json["url"]
        parse = urlparse(url)
        parsed_query = parse_qs(parse.query)
        print(request.json)
        STATE.timedtext = request.json["timedtext"]

    if request.method == "GET":
        return STATE.timedtext

def main():
    STATE.app.run(debug=True)

if __name__ == "__main__":
    main()
