import os
import json
import random
from time import time
from anki_utils import *

class ProjectConfig:

    def __init__(self,
                 projects_folder : str):

        self._locked = False
        self.projects_folder = os.path.abspath(projects_folder)

        def erase_init():
            raise Exception("Só pode haver uma configuração")

        ProjectConfig.__init__ = erase_init
        self._lock()

    def __setattr__(self, name, value):
        if name != "_locked" and self._locked:
            raise Exception("A configuração está trancada")
        else:
            super().__setattr__(name, value)

    def _lock(self):
        self._locked = True


class Project:
    _current_project = None
    _config = None
    _properties = [
            "video_url",
            "last_access",
            ]
    _write_on_modifying = _properties

    _protected = [
            "last_access"
            ]

    @classmethod
    def get_filepath(cls, filename):
        dir = cls._config.projects_folder

        if not os.path.isdir(dir):
            raise Exception(f"A pasta não é uma pasta, ou não existe: {dir}")

        return os.path.join(dir, filename)

    @classmethod
    def get_filename(cls, name):
        return name + ".json"

    @classmethod
    def get_ankifile_filepath(cls, name):
        return os.path.join(cls._config.projects_folder, name + ".txt")

    @classmethod
    def configure(cls, config : ProjectConfig):
        if cls._config:
            raise Exception("Já foi configurado")

        cls._config = config

        if not os.path.isdir(config.projects_folder) and\
                not os.path.isfile(config.projects_folder):
                    os.mkdir(config.projects_folder)

    @classmethod
    def create_project(cls, name : str, video_url : str):
        filename = cls.get_filename(name)
        filepath = cls.get_filepath(filename)

        if os.path.isfile(filepath):
            raise Exception(f"Ficheiro existe: {filepath}")
        elif os.path.isdir(filepath):
            raise Exception(f"Ficheiro existe e é uma pasta: {filepath}")

        p = Project(name)
        p.video_url = video_url
        p.update_last_access()
        p.write()

        cls._current_project = p

        return p

    @classmethod
    def open_project(cls, name):
        p = Project(name)
        p.update_last_access()

        cls._current_project = p

        return p

    @classmethod
    def get_projects(cls):
        p = os.listdir(cls._config.projects_folder)
        p = [x[:-5] for x in p if x.endswith(".json")]
        return p

    @classmethod
    def current(cls):
        return cls._current_project

    def __init__(self, name : str):
        self._protected_lock = True
        self._ready = False

        self.filename = Project.get_filename(name) 
        self.filepath = Project.get_filepath(self.filename)

        self.video_url : str = None
        self.last_access : int = None

        self.anki_file = AnkiFile(Project.get_ankifile_filepath(name))

        self._lock()

        if os.path.isfile(self.filepath):
            self.read()
        elif os.path.isdir(self.filepath):
            raise Exception(f"{self.filename} é um pasta; tal é inaceitável")

        self._ready = True

    def _lock(self):
        self._protected_lock = True

    def _unlock(self):
        self._protected_lock = False

    def __setattr__(self, name, value):
        if name[0] == "_" or not self._ready:
            return super().__setattr__(name, value)

        if self._protected_lock and\
            name in self._protected:
            raise Exception(f"A propriedade é protegida: {name}")

        super().__setattr__(name, value)

        if name in self._write_on_modifying:
            self.write()

    def write(self):
        d = {}
        for x in self._properties:
            d[x] = getattr(self, x)

        with open(self.filepath, "w") as f:
            json.dump(d, f)

    def read(self):
        data = None
        with open(self.filepath, "r") as f:
            data = json.load(f)

        for key,val in data.items():
            if key in self._properties:
                self.__setattr__(key, val)

    def update_last_access(self):
        self._unlock()
        self.last_access = time()
        self._lock()

def __test():
    config = ProjectConfig("ProjetosDeTeste")
    Project.configure(config)
    Project.create_project(str(random.randint(0, 10000)), "queijo")

if __name__ == "__main__":
    __test()
