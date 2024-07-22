from deep_translator.base import LanguageNotSupportedException
from flask import Flask, request, abort
from dictionaries import PTDict, CEDict
from glosbe import GlosbeDict
from deep_translator import GoogleTranslator
from functools import lru_cache
import inspect

dictionaries = {
	"ptdict": PTDict("dictionary.json"),
	"cedict": CEDict("cedict_ts.u8"),
	"glosbe": GlosbeDict("glosbe", "zh", "pt")
}

translation_services = {}

for x in (GoogleTranslator,):
	key = x.__name__
	translation_services[key] = x
	print(f"Serviço de tradução `{key}` registado")

class TranslatorInfo:
	def __init__(self, source, target, service):
		self.source = source
		self.target = target
		self.service = service

	def __eq__(self, b):
		return self.source == b.source and \
				self.target == b.target and \
				self.service == b.service

	def __hash__(self):
		return hash((self.source, self.target, self.service))

	def __repr__(self):
		return f"<Tradutor<{self.service}> {self.source}→{self.target}>"

class Translator:
	def __init__(self):
		self._translators = {}

	def get_translator(self, source, target, service):
		if service not in translation_services.keys():
			raise NotImplementedError

		# verificar se o serviço é compatível com as línguas
		s = translation_services[service]
		supported_languages = s().get_supported_languages(as_dict=True)

		for lang in (source, target):
			if lang not in supported_languages.keys() and\
				lang not in supported_languages.values():
					raise LanguageNotSupportedException(f"O serviço de tradução `{service}` não suporta a língua `{lang}`")

		info = TranslatorInfo(source, target, service)
		
		if info in self._translators.keys():
			return self._translators[info]

		translator = translation_services[service](source=source, target=target)
		self._translators[info] = translator
		return translator

	@lru_cache()
	def translate(self, source, target, service, text):
		translator = self.get_translator(source, target, service)
		return translator.translate(text)
		

class Api:
	def __init__(self):
		self.app = Flask(__name__)
		self.actions = [
			"search_dictionary",
			"break_words",
			"translate"
		]

		self.app.after_request(self.after_request)
		self.app.add_url_rule("/", view_func=self.view_func, methods=["POST", "GET"])

		self.translator = Translator()

	def after_request(self, response):
		response.headers.add("Access-Control-Allow-Origin", "*")
		response.headers.add("Access-Control-Allow-Headers", "Content-Type")
		return response

	def view_func(self):

		if request.method == "GET":
			return "<h1>O sistema está a funcionar :)</h1>"

		json = request.json

		if json is None:
			abort(400, "Não foram enviados quaisquer dados `json`")

		if "action" not in json.keys():
			abort(400, "Ação não especificada (`action` não existe)")

		action = json["action"]
		params = json["params"] if "params" in json.keys() else {}

		if action in self.actions:
			func = getattr(self, action)
			anot = inspect.getfullargspec(func).annotations
			
			for a in anot.keys():
				if a not in params.keys():
					abort(400, f"Falta o parâmetro `{a}`")

				if type(params[a]) is not anot[a]:
					abort(400, f"O parâmetro `{a}` deveria de ser do tipo `{anot[a].__name__}`")

			return func(**params)

		abort(400, "Ação (`action`) inválida: " + action)

	def run(self, *args, **kwargs):
		self.app.run(*args, **kwargs)

	def search_dictionary(self, dictionary: str, query: str):
		if dictionary == "cedict":
			key = "simplified"
		elif dictionary == "ptdict":
			key = "chinese"
		else:
			abort(501, f"O dicionário `{dictionary}` ou não existe, ou não foi implementado")

		d = dictionaries[dictionary]

		return d.levenshtein_search(query, key)

	def translate(self, source, target, service, text):
		return self.translator.translate(source, target, service, text)

	def break_words(self, dictionary: str, string: str):
		if dictionary == "cedict":
			key = "simplified"
		elif dictionary == "ptdict":
			key = "chinese"
		else:
			abort(501, f"O dicionário `{dictionary}` ou não existe, ou não foi implementado")

		d = dictionaries[dictionary]

		return d.break_words(string, key)



def main():

	api = Api()
	api.run(debug=True)

if __name__ == "__main__":
	main()
