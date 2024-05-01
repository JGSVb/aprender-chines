import os
import json
import random

DEFAULT_ANKI_FORMAT = 5

class AnkiCard:
    def __init__(self, values, format=DEFAULT_ANKI_FORMAT):
        self._locked = False

        self.format = format

        if len(values) != format:
            raise Exception(f"A quantidade de valores não coicide com o formato desejado ({len(values)} != {format})")

        self.values = values
        self.id : int = None

    def __setattr__(self, name, value):
        if name != "_locked" and self._locked:
            raise Exception("A carta está trancada")
        else:
            super().__setattr__(name, value)

    def _lock(self):
        self._locked = True

    def __repr__(self):
        return f"<AnkiCard format={self.format} values={self.values} id={self.id}>"

class AnkiFile:
    def __init__(self, filepath, format=DEFAULT_ANKI_FORMAT):
        self.filepath = os.path.abspath(filepath)
        self.cards = []
        self.format = format
        self.separator = "\t"

        if os.path.isfile(self.filepath):
            self.read()

        elif os.path.isdir(self.filepath):
            raise Exception(f"{self.filepath} é um pasta; tal é inaceitável")

        else:
            self.write()


    def read(self):
        lines = None

        with open(self.filepath, "r") as f:
            lines = f.readlines()

        if len(lines):
            format = len(lines[0].split(self.separator))

            if format != self.format:
                raise Exception(f"Os formatos desejado e do ficheiro são diferentes ({self.format} != {format})")

        else:
            return


        for l in lines:
            values = l.split(self.separator)
            values[-1] = values[-1][:-1] # remover o último caracter porque vai ser sempre "\n" devido ao formato do ficheiro
            card = AnkiCard(values, self.format)
            self.add_card(card)

    def write(self):
        lines = []

        for card in self.cards:
            l = self.separator.join(card.values) + "\n"
            lines.append(l)

        with open(self.filepath, "w") as f:
            f.truncate(0)
            f.writelines(lines)

    def get_new_card_id(self):
        id = 0

        for card in self.cards:
            if id == card.id:
                id = random.randint(0, 99999)

        return id

    def get_card(self, id):
        for card in self.cards:
            if card.id == id:
                return card

        return None

    def before_add_card_hook(self, card):
        if card.format != self.format:
            raise Exception(f"O formato da carta é diferente do formato do ficheiro ({card.format} != {self.format})")

        for c in self.cards:
            if c.values[0] == card.values[0]:
                raise Exception(f"Já existe uma carta cujo values[0] seja {card.values[0]}")

    def post_add_card_hook(self):
        self.write()

    def add_card(self, card : AnkiCard):
        self.before_add_card_hook(card)

        id = self.get_new_card_id()
        card.id = id

        self.cards.append(card)

        self.post_add_card_hook()

        card._lock()

    def post_delete_card_hook(self):
        self.write()

    def delete_card(self, id):
        card = self.get_card(id)

        if card is None:
            raise Exception(f"Não existe carta alguma cujo id={id}")
        else:
            self.cards.remove(card)
            self.post_delete_card_hook()

    def post_replace_card_hook(self, new_card : AnkiCard):
        new_card._lock()
        self.write()

    def replace_card(self, id, new_card : AnkiCard):
        card = self.get_card(id)

        if card is None:
            raise Exception(f"Não existe carta alguma cujo id={id}")
        else:
            index = self.cards.index(card)
            self.cards[index] = new_card
            new_card.id = id
            self.post_replace_card_hook(new_card)

        return card

    def get_cards(self):
        return self.cards.copy()

    def get_json_compatible_cards(self):
        card_list = []

        for card in self.cards:
            card_list.append({
                "id": card.id,
                "values": card.values
                })

        return card_list

    def get_json_cards(self):
        return json.dumps(self.get_json_compatible_cards())
