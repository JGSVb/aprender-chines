import flask
from flask import Flask, json, jsonify, render_template, request, send_file
import argparse
import sys
import os

app = Flask(__name__)

@app.get("/")
def index():
	return render_template("index.html")

@app.route("/boxes", methods=["POST", "GET"])
def boxes():
	if request.method == "GET":
		data = []

		if os.path.isfile(app.config["boxes_filepath"]):
			with open(app.config["boxes_filepath"], "r") as f:
				data = json.loads(f.read())

		return jsonify(data)

	if request.method == "POST":
		with open(app.config["boxes_filepath"], "w") as f:
			json.dump(request.json, f)

		return "ok"

@app.get("/video")
def video():
	return send_file(app.config["video_filepath"])

def main():
	parser = argparse.ArgumentParser()
	parser.add_argument("video_filepath", help="caminho para o ficheiro de vídeo")
	parser.add_argument("boxes_filepath", help="caminho para o ficheiro de saída das caixas")
	args = parser.parse_args()

	app.config["video_filepath"] = args.video_filepath

	if(not args.boxes_filepath.endswith(".json")):
		raise Exception()

	app.config["boxes_filepath"] = args.boxes_filepath
	app.run(debug=True)

if __name__ == "__main__":
	main()
