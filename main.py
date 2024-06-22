import os
import pinyin
import jieba
from dotenv import load_dotenv
from requests import get as req_get
from urllib.parse import urlparse, parse_qs
from flask import Flask, render_template, request, jsonify, Response, redirect, send_from_directory
from utils import *
from typing import List

from anki_utils import *
from project import *
from protocol import *

_v = verbose

proj_conf = ProjectConfig(
    projects_folder="Projetos",
    json_filename="config.json",
    anki_filename="anki.txt",
    timedtext_folder="timedtext",
    timedtext_prefix="timedtext_",
    timedtext_suffix=".json")

Project.configure(proj_conf)

class STATE:
    app = Flask(__name__)
    timedtext = None
    timedtext_url = None

def get_youtube_video_id(youtube_video_url):
    query = urlparse(youtube_video_url).query
    return parse_qs(query)["v"][0]


@STATE.app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(STATE.app.root_path, "static"),
                               "favicon.ico", mimetype="image/vnd.microsoft.icon")

@STATE.app.get("/")
def main_page():
    force_main = request.args.get("force_main")

    if Project.current() and not force_main:
        return redirect("/project/" + Project.current().name)

    projects = Project.get_projects()
    projects.sort(key=Project.cmp_func_last_access)
    projects.reverse()
    return render_template("get_started.html", projects=projects)

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
    return redirect("/project/" + project_name)

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

    @STATE.app.get("/json_card_by_index")
    @response_func
    def get_card_by_index():
        index = int(request.args.get("index"))
        return Project.current().anki_file.get_json_compatible_cards()[index]

    @STATE.app.post("/addcard")
    @response_func
    def addcard():
        card = AnkiCard(request.json)
        return Project.current().anki_file.add_card(card)

    @STATE.app.route("/card/<int:card_id>", methods=["POST", "DELETE"])
    @response_func
    def card_route(card_id):
        if request.method == "POST":
            new_card = AnkiCard(request.json)
            Project.current().anki_file.replace_card(card_id, new_card)
            return None

        if request.method == "DELETE":
            Project.current().anki_file.delete_card(card_id)
            return None

@STATE.app.route("/timedtext", methods=["POST", "GET"])
@response_func
def timedtext():
    if request.method == "POST":
        url = request.json["url"]
        parse = urlparse(url)
        parsed_query = parse_qs(parse.query)
        lang = parsed_query["lang"][0]
        STATE.timedtext = request.json["timedtext"]
        Project.current().save_timedtext(lang, request.json["timedtext"])

    if request.method == "GET":
        lang = request.args.get("lang")
        if not lang:

            if not STATE.timedtext:
                STATE.timedtext = Project.current().load_first_timedtext()

            return STATE.timedtext
        else:
            return Project.current().load_timedtext(lang)

@STATE.app.get("/list_timedtext")
@response_func
def list_timedtext():
    return Project.current().list_timedtext()

load_dotenv()
CX_ID = os.environ["CX_ID"]
API_KEY = os.environ["API_KEY"]

search_api_link = "https://www.googleapis.com/customsearch/v1?c2coff=1&searchType=image&key={}&cx={}&q={}"

def get_request_location(query):
    return search_api_link.format(API_KEY, CX_ID, query)

@STATE.app.get("/image_search")
@response_func
def search():
    query = request.args.get("q")
    location = get_request_location(query)
    result = req_get(location).json()

    output = [x["link"] for x in result["items"]]

    return output

def main():
    STATE.app.run(debug=True)

if __name__ == "__main__":
    main()
