import json
import cedict_parser
from functools import lru_cache

class Dictionary:

    @staticmethod
    def select_func_contains(query, e):
        return query in e["chinese"]

    @staticmethod
    def key_func_eq(query, e):
        if e["chinese"] == query:
            return 0

        return 99999

    def load_data(self):
        raise NotImplementedError()

    @lru_cache()
    def search(self, query, select_func, key_func):
        result = []

        for e in self.data:
            if select_func(query, e):
                result.append(e)

        result.sort(key=lambda x: key_func(query, x))

        return result

    def __init__(self, filename):

        self.data = None
        self.filename = filename

        self.load_data()


class PTDict(Dictionary):

    def load_data(self):
        with open(self.filename, "r") as file:
            self.data = json.load(file)

    def search(self, query, select_func=Dictionary.select_func_contains, key_func=Dictionary.key_func_eq):
        return super().search(query, select_func, key_func)


class CEDict(Dictionary):

    def load_data(self):
        self.data = cedict_parser.parse(self.filename)

    @staticmethod
    def select_func_contains(query, e):
        return query in e["simplified"] or query in e["traditional"]

    @staticmethod
    def key_func_eq(query, e):
        if e["simplified"] == query or e["traditional"] == query:
            return 0

        return 99999

    def search(self, query, select_func=select_func_contains, key_func=key_func_eq):
        return super().search(query, select_func, key_func)
