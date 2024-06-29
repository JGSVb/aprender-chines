import json
import cedict_parser
from functools import lru_cache

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
    def search(self, query, *select_func):
        result = []

        for i,s in enumerate(select_func):
            curr = []

            for e in self.data:
                if s(query, e):
                    curr.append(e)

            result.append(curr)

        return result

    def __init__(self, filename):

        self.data = None
        self.filename = filename

        self.load_data()


class PTDict(Dictionary):

    def load_data(self):
        with open(self.filename, "r") as file:
            self.data = json.load(file)

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

    def search(self, query, *select_func):
        if not select_func:
            select_func = (
                    AnkiDict.select_func_eq,
                    AnkiDict.select_func_contains
                    )

        return super().search(query, *select_func)
