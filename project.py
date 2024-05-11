import os
import json
import random
from time import time
from anki_utils import *

class ProjectConfig:

    def __init__(self,
                 projects_folder : str,
                 json_filename : str,
                 anki_filename : str):

        self._locked = False
        self.projects_folder = os.path.abspath(projects_folder)
        self.json_filename = json_filename
        self.anki_filename = anki_filename

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
    def get_dirpath(cls, name):
        return os.path.join(cls._config.projects_folder, name)

    @classmethod
    def get_json_filepath(cls, name):
        dir = cls.get_dirpath(name)

        return os.path.join(dir, cls._config.json_filename)

    @classmethod
    def get_ankifile_filepath(cls, name):
        dir = cls.get_dirpath(name)
        return os.path.join(dir, cls._config.anki_filename)

    @classmethod
    def build_tree(cls, name):
        dirpath = cls.get_dirpath(name)

        if os.path.isfile(dirpath):
            raise Exception(f"Impossível criar árvore do projeto, visto o diretório ser um ficheiro: {dirpath}")

        if not os.path.isdir(dirpath):
            os.mkdir(dirpath)

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
        dirpath = cls.get_dirpath(name)

        if name in cls.get_projects():
            raise Exception(f"Projeto existe: {name}")

        cls.build_tree(name)

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
        p = [x for x in p if os.path.isdir(x)]
        return p

    @classmethod
    def current(cls):
        return cls._current_project

    def __init__(self, name : str):
        self._protected_lock = True
        self._ready = False

        self.dirpath = Project.get_dirpath(name)
        self.json_filepath = Project.get_json_filepath(name)

        self.video_url : str = None
        self.last_access : float = None

        self.anki_file = AnkiFile(Project.get_ankifile_filepath(name))

        self._lock()

        if os.path.isfile(self.json_filepath):
            self.read()
        elif os.path.isdir(self.json_filepath):
            raise Exception(f"{self.json_filename} é um pasta; tal é inaceitável")

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
        if not os.path.isdir(self.dirpath):
            os.mkdir(self.dirpath)

        d = {}
        for x in self._properties:
            d[x] = getattr(self, x)

        with open(self.json_filepath, "w") as f:
            json.dump(d, f)

    def read(self):
        data = None
        with open(self.json_filepath, "r") as f:
            data = json.load(f)

        for key,val in data.items():
            if key in self._properties:
                self.__setattr__(key, val)

    def update_last_access(self):
        self._unlock()
        self.last_access = time()
        self._lock()

def __test():
    config = ProjectConfig("ProjetosDeTeste", "config.json", "anki.txt")
    proj_name = str(random.randint(0, 9999))
    Project.configure(config)
    Project.create_project(proj_name, "queijo")
    Project.open_project(proj_name)

if __name__ == "__main__":
    __test()
