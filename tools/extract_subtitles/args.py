ARGS = [
	(
		["video_filepath"],
		{"help": "caminho para o ficheiro de vídeo"}
	),
	(
		["boxes_filepath"],
		{"help": "caminho para o ficheiro de saída das caixas"}	
   )
]

def add_args(parser):
	for a in ARGS:
		parser.add_argument(*(a[0]), **(a[1]))

