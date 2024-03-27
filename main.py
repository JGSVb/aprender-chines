import os
import pinyin
import easyocr
import jieba
from flask import Flask, render_template, request, jsonify, Response
import requests

from deep_translator import GoogleTranslator
"""
from deep_translator import (GoogleTranslator,
                             ChatGptTranslator,
                             YandexTranslator,
                             BaiduTranslator)
"""

from time import sleep
from pynput.keyboard import Key, Controller

translator = {}

def translate(text, source, target):
    key = ",".join([source, target])
    if not key in translator.keys():
        translator[key] = GoogleTranslator(source=source, target=target)

    return translator[key].translate(text = text)

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

_v = verbose

@verbose
def system(cmd):
    return os.system(cmd)

class CONFIG:
    target_dir = os.path.join(os.path.dirname(__file__), "target")
    cmd = "xdg-open https://fanyi.baidu.com/#zh/en/{}"
    delay = 0.7

def touch(filepath : str):
    if(os.path.exists(filepath)):
        raise FileExistsError

    with open(filepath, "w") as f:
        pass

class Watchdog:
    def __init__(self):
        self.before = []
        self.actual= []
        self.reader = easyocr.Reader(['ch_sim',])

        self.has_content = False
        self.chinese = None
        self.pinyin = None

    def fetch_once(self):

        self.actual = os.listdir(CONFIG.target_dir)

        diff = [x for x in self.actual if x not in self.before]
        diff = [os.path.join(CONFIG.target_dir, x) for x in diff]
        diff = [x for x in diff if x.endswith(".png")]

        self.before = self.actual

        if not diff:
            return

        f = diff[-1]

        result = self.reader.readtext(f, detail = 0)
        result = " ".join(result)

        py = pinyin.get(" ".join(jieba.lcut(result)))

        self.pinyin = py
        self.chinese = result
        self.has_content = True

app = Flask(__name__)
wg = Watchdog()

@app.after_request
def add_security_headers(response):
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    return response

@app.route('/embed')
def embed():
    # Get the URL of the website to embed from the query parameters
    url = request.args.get('url')
    
    # Fetch the content of the website
    response = requests.get(url)
    
    # Return the content as a response
    return Response(response.content, content_type=response.headers['content-type'])

@app.route("/")
def main_page():
    video_id = request.args.get("url")
    return render_template("main.html", video_id = video_id)

@app.get("/fetch_text")
def fetch_text():
    wg.fetch_once()
    type = request.args.get("type")

    if not wg.has_content:
        return ""

    if type == "pinyin":
        return wg.pinyin
    elif type == "chinese":
        return wg.chinese

    return "invalid_query"

@app.get("/fetch_translation")
def fetch_translation():
    text = request.args.get("text")
    way = request.args.get("way")
    source, target = way.split(",")
    return translate(text, source, target)

def keyboard_click(ctrl, key, delay=0.05):
    ctrl.press(key)
    sleep(delay)
    ctrl.release(key)

@app.get("/anki_routine")
def anki_routine():
    a = request.args.get("A")
    d = request.args.get("D")
    keyboard = Controller()

    seq = [
            (keyboard.type,  a),
            (keyboard_click, keyboard, Key.tab),
            (keyboard.type,  pinyin.get(a)),
            (keyboard_click, keyboard, Key.tab),
            (keyboard.type,  wg.chars),
            (keyboard_click, keyboard, Key.tab),
            (keyboard.type,  d),]

    sleep(2)
    for x in seq:
        sleep(0.2)
        _v(x[0])(*x[1:])


    return ""

def main():
    _v(os.makedirs)(CONFIG.target_dir, exist_ok=True)

    for file in os.listdir(CONFIG.target_dir):
        path = os.path.join(CONFIG.target_dir, file)
        os.rename(path, path+"_")


    app.run(debug=True)
    # watchdog()

if __name__ == "__main__":
    main()
