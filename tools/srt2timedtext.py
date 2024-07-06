import srt
import sys
import json

USAGE = """\
python srt2timedtext.py FICHEIRO.srt\
"""

def main():
	filename = None

	try:
		filename = sys.argv[1]
	except IndexError:
		print(USAGE)
		exit(-1)

	subs = None

	with open(filename, "r") as fp:
		subs = srt.parse(fp.read())

	result = {"events": []}

	for x in subs:
		
		start = int(x.start.total_seconds()*1000)
		end = int(x.end.total_seconds()*1000)
		delta = end-start

		event = {
				"tStartMs": start,
				"dDurationMs": delta,
				"segs": [
					{"utf8": x.content}
					]
				}
		result["events"].append(event)

		print(result, x)
		exit(-1)

	with open(filename+"_timedtext.json", "w") as file:
		json.dump(result, file, indent=4)

if __name__ == "__main__":
	main()
