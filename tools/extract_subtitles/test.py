import argparse
from args import add_args
import json
import cv2 as cv
from paddleocr import PaddleOCR
import logging

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
		self.ocr = PaddleOCR(lang=lang, use_gpu=use_gpu)

		self.video_fps = self.video.get(cv.CAP_PROP_FPS)
		self.video_frames = self.video.get(cv.CAP_PROP_FRAME_COUNT)

	def extract_at_frame(self, frame_id, box):
		self.video.set(cv.CAP_PROP_POS_FRAMES, frame_id)
		ret, frame = self.video.read()
		
		if not ret:
			return None

		x1 = round(box["x1"])
		y1 = round(box["y1"])
		x2 = round(box["x2"])
		y2 = round(box["y2"])

		frame_crop = frame[y1:y2, x1:x2]

		result = self.ocr.ocr(frame_crop)

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
