import json
from typing import List, Union
import cedict_parser
from functools import lru_cache
from Levenshtein import ratio

# TODO: na classe Dictionary, implementar uma função search que receba um parâmetro
# key, o qual corresponde à chave que se vai testar a função f
# def search(self, query, key, func):
#	....

class Dictionary:

	@staticmethod
	def select_func_contains(query, e):
		return query in e["chinese"]

	@staticmethod
	def select_func_eq(query, e):
		return query.strip() == e["chinese"].strip()

	def load_data(self):
		raise NotImplementedError()

	@lru_cache()
	def check_dictionary(self, segment, key):
		for e in self.data: # type: ignore
			if e[key] == segment:
				return e

		return None

	def break_words(self, string, key, max_size=5):
		if self.data is None:
			raise TypeError

		string = string.strip()
		length = len(string)
		word_vector = []
		i = 0

		
		while i < length:

			k = 1
			for k in range(max_size, 0, -1):
				seg = string[i:i+k]
				entry = self.check_dictionary(seg, key)
				
				if entry:
					word_vector.append((i, i+k, entry, True))
					break

			i += k

		for i in range(len(word_vector) - 1):
			word = word_vector[i]
			next_word = word_vector[i + 1]

			gap = next_word[0] - word[1]

			if gap > 0:
				start = word[1]
				end = next_word[0]
				word_vector.append((start, end, string[start:end], False))

		word_vector.sort(key = lambda x: x[1])

		return word_vector

	@lru_cache()
	def levenshtein_search(self, query, key, min_sim=0.01):
		if self.data is None:
			raise TypeError

		copy = self.data.copy()
		copy.sort(key=lambda x: ratio(query, x[key]))

		return list(filter(lambda x: ratio(query, x[key]) >= min_sim, copy))

	@lru_cache()
	def search(self, query, *select_func):
		if type(self.data) is not list:
			raise TypeError()

		result = []

		for _,s in enumerate(select_func):
			curr = []

			for e in self.data:
				if s(query, e):
					curr.append(e)

			result.append(curr)

		return result

	@lru_cache()
	def slice(self, start, end, key=None):
		if type(self.data) is not list:
			raise TypeError()

		data = self.data.copy()

		if key:
			data.sort(key=key)

		return data[start:end]

	def __init__(self, filename):

		self.data : Union[List, None] = None
		self.filename = filename

		self.load_data()


class PTDict(Dictionary):

	def load_data(self):
		with open(self.filename, "r") as file:
			self.data = json.load(file)

	@lru_cache()
	def search(self, query, *select_func):
		if not select_func:
			select_func = (
					Dictionary.select_func_eq,
					Dictionary.select_func_contains
					)

		return super().search(query, *select_func)


class CEDict(Dictionary):

	def load_data(self):
		self.data = cedict_parser.parse(self.filename)

	@staticmethod
	def select_func_contains(query, e):
		return query in e["simplified"] or query in e["traditional"]

	@staticmethod
	def select_func_eq(query, e):
		return query.strip() == e["simplified"].strip() or query.strip() == e["traditional"].strip()

	@lru_cache()
	def search(self, query, *select_func):
		if not select_func:
			select_func = (
					CEDict.select_func_eq,
					CEDict.select_func_contains
					)

		return super().search(query, *select_func)

class AnkiDict(Dictionary):
	def load_data(self):
		self.data = []

		with open(self.filename, "r") as file:
			lines = file.readlines()

			for x in lines:
				self.data.append([e.strip() for e in x.split("\t")])

	@staticmethod
	def select_func_contains(query, e):
		return query in e[0]

	@staticmethod
	def select_func_eq(query, e):
		return query.strip() == e[0]

	@lru_cache()
	def search(self, query, *select_func):
		if not select_func:
			select_func = (
					AnkiDict.select_func_eq,
					AnkiDict.select_func_contains
					)

		return super().search(query, *select_func)
