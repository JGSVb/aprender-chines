import argparse
from args import add_args
import json
import cv2 as cv
from paddleocr import PaddleOCR
import logging
from shapely.geometry import Polygon
from functools import lru_cache

logger = logging.getLogger("ppocr")
logger.setLevel(logging.ERROR)

class PredictedSubtitle:
	def __init__(self, text : str, confidence : float, frame : int, time : float, box : dict):
		self.text = text
		self.confidence = confidence
		self.frame = frame
		self.time = time
		self.box = box

	def __repr__(self):
		return f"[{repr(self.text)}, {round(self.confidence*100)}%]"

class SubtitlesExtractor:
	def __init__(self, video_filepath, use_gpu=True, lang="ch"):
		self.video_filepath = video_filepath
		self.video = cv.VideoCapture(self.video_filepath)

		self.video_fps = self.video.get(cv.CAP_PROP_FPS)
		self.video_frames = self.video.get(cv.CAP_PROP_FRAME_COUNT)
		self.framecount = self.video.get(cv.CAP_PROP_FRAME_COUNT)

		self.ocr = PaddleOCR(lang=lang, use_gpu=use_gpu)

		def ocr_at_frame(frame_id):
			return self.ocr.ocr(self.read_frame(frame_id))

		self.ocr_at_frame = lru_cache(maxsize=int(self.framecount))(ocr_at_frame)

	def read_frame(self, frame_id):
		self.video.set(cv.CAP_PROP_POS_FRAMES, frame_id)
		ret, frame = self.video.read()

		return ret, frame

	def get_boundaries_at_frame(self, frame_id):
		ocr = self.ocr_at_frame(frame_id)

		if not ocr:
			return []

		result = []

		for boundaries, _ in ocr[0]:
			p = Polygon(*boundaries)
			result.append(p)

		return result

	def choose_text_at_frame(self, frame_id, box):
		x1 = box["x1"]
		y1 = box["y1"]
		x2 = box["x2"]
		y2 = box["y2"]

		ocr = self.ocr_at_frame(frame_id)
		box_polygon = Polygon([(x1, y1), (x1, y2), (x2, y1), (x2, y2)])
		boundaries = self.get_boundaries_at_frame(frame_id)

		result = []

		for i, b in enumerate(boundaries):
			if box_polygon.intersects(b):
				result.append(ocr[0][i][1])

		return result

	def extract_at_frame(self, frame_id, box):
		result = self.ocr_at_frame(frame_id)
		
		if not result:
			return None

		if result[0]:
			text = " ".join(t for _, (t, _) in result[0])
			result_len = len(result[0])
			confidence = sum([x/result_len for _, (_, x) in result[0]])
			time = frame_id / self.video_fps
			return PredictedSubtitle(text, confidence, frame_id, time, box)
		
		return None

	def extract_from_box(self, box, fps):
		frame_start = round(box["t_start"] * self.video_fps)
		frame_end = round(box["t_end"] * self.video_fps)
		step = round(self.video_fps / fps)

		subtitles = []

		for f in range(frame_start, frame_end, step):
			st = self.extract_at_frame(f, box)

			if st:
				subtitles.append(st)

		return subtitles

	def extract(self, boxes, fps):
		# TODO
		return self.extract_from_box(boxes[0], fps)
		
def main():
	parser = argparse.ArgumentParser()
	add_args(parser)
	args = parser.parse_args()

	fp = open(args.boxes_filepath, "r")
	boxes = json.load(fp)
	fp.close()
	
	es = SubtitlesExtractor(args.video_filepath)
	
	print(es.extract(boxes, 10))

if __name__ == "__main__":
	main()
