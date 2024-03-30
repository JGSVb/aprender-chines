import os
import pinyin
import jieba
from flask import Flask, render_template, request, jsonify, Response, redirect

"""
from deep_translator import (GoogleTranslator,
                             ChatGptTranslator,
                             YandexTranslator,
                             BaiduTranslator)
"""

from utils import *

_v = verbose

class CONFIG:
    target_dir = os.path.join(os.path.dirname(__file__), "target")
    anki_dir = os.path.join(os.path.dirname(__file__), "anki_coll")

class STATE:
    app = Flask(__name__)
    wg = Watchdog(CONFIG.target_dir)
    project_name = None
    anki_file = None
    anki_filepath = None

@STATE.app.route("/get_started")
def get_started_page():
    return render_template("get_started.html")

@STATE.app.route("/")
def main_page():
    video_id = request.args.get("video_id")
    project_name = request.args.get("project_name")

    if not video_id or not project_name:
        return redirect("/get_started")

    STATE.project_name = project_name
    STATE.anki_filepath = os.path.join(CONFIG.anki_dir, STATE.project_name + ".txt")
    STATE.anki_file = AnkiFile.by_filepath(STATE.anki_filepath)

    return render_template("main.html", video_id = video_id, project_name = project_name)

@STATE.app.get("/fetch_chinese")
def fetch_chinese():
    STATE.wg.fetch_once()
    return STATE.wg.chinese if STATE.wg.chinese else ""

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

    STATE.anki_file.add_card(question_a, question_b, awnser, meaning, write = True)
    return ""


def clean():

    for file in os.listdir(CONFIG.target_dir):
        path = os.path.join(CONFIG.target_dir, file)
        os.rename(path, path+"_")

def main():
    _v(os.makedirs)(CONFIG.target_dir, exist_ok=True)
    _v(os.makedirs)(CONFIG.anki_dir, exist_ok=True)

    print("""Temporariamente desativado: """
    """
    clean()
    """
    )

    STATE.app.run(debug=True)

if __name__ == "__main__":
    main()
