import os
import pinyin
import jieba
from flask import Flask, render_template, request, jsonify, Response

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

app = Flask(__name__)
wg = Watchdog(CONFIG.target_dir)

@app.route("/")
def main_page():
    video_id = request.args.get("url")
    return render_template("main.html", video_id = video_id)

@app.get("/fetch_chinese")
def fetch_chinese():
    wg.fetch_once()
    return wg.chinese if wg.chinese else ""

@app.get("/pinyin")
def pinyin_():
    text = request.args.get("chinese")
    return pinyin.get(text)

@app.get("/words")
def split_words():
    text = request.args.get("chinese")
    return jsonify(list(jieba.cut(text)))

@app.get("/translate")
def translate_():
    text = request.args.get("text")
    way = request.args.get("way")
    source, target = way.split(",")
    return translate(text, source, target)

@app.get("/dictionary")
def dictionary():
    query = request.args.get("query")
    entries = get_dictionary_for(query)
    return jsonify(entries)

@app.get("/anki_routine")
def anki_routine():
    print("refazer com copy paste em vez de pynput.type etc...")
    return ""

def clean():

    for file in os.listdir(CONFIG.target_dir):
        path = os.path.join(CONFIG.target_dir, file)
        os.rename(path, path+"_")

def main():
    _v(os.makedirs)(CONFIG.target_dir, exist_ok=True)

    print("""Temporariamente desativado: """
    """
    clean()
    """
    )

    app.run(debug=True)

if __name__ == "__main__":
    main()
