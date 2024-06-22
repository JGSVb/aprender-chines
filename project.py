import os
import json
import random
from time import time
from anki_utils import *

class ProjectConfig:

    def __init__(self,
                 projects_folder : str,
                 json_filename : str,
                 anki_filename : str,
                 timedtext_folder : str,
                 timedtext_prefix : str,
                 timedtext_suffix : str):

        self._locked = False
        self.projects_folder = os.path.abspath(projects_folder)
        self.json_filename = json_filename
        self.anki_filename = anki_filename
        self.timedtext_folder = timedtext_folder
        self.timedtext_prefix = timedtext_prefix
        self.timedtext_suffix = timedtext_suffix

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

    @staticmethod
    def cmp_func_last_access(name : str):
        return Project(name, load_anki=False).last_access

    @classmethod
    def get_dirpath(cls, name):
        return os.path.join(cls._config.projects_folder, name)

    @classmethod
    def get_json_filepath(cls, name):
        dir = cls.get_dirpath(name)

        return os.path.join(dir, cls._config.json_filename)

    @classmethod
    def get_timedtext_dirpath(cls, name):
        dir = cls.get_dirpath(name)

        return os.path.join(dir, cls._config.timedtext_folder)

    @classmethod
    def get_timedtext_filepath(cls, name, lang):
        dir = cls.get_timedtext_dirpath(name)

        return os.path.join(dir, cls._config.timedtext_prefix + lang + cls._config.timedtext_suffix)

    @classmethod
    def get_ankifile_filepath(cls, name):
        dir = cls.get_dirpath(name)
        return os.path.join(dir, cls._config.anki_filename)

    @classmethod
    def build_tree(cls, name):

        dirpath = cls.get_dirpath(name)
        os.mkdir(dirpath)

        timedtext_dirpath = cls.get_timedtext_dirpath(name)
        os.mkdir(timedtext_dirpath)

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

        p = Project(name, read=False)
        p.video_url = video_url
        p._update_last_access()
        p.write()

        cls._current_project = p

        return p

    @classmethod
    def open_project(cls, name):
        p = Project(name)
        p._update_last_access()

        cls._current_project = p

        return p

    @classmethod
    def close_project(cls):
        cls._current_project = None

    @classmethod
    def get_projects(cls):
        projects = os.listdir(cls._config.projects_folder)
        for p in projects:
            filepath = os.path.join(cls._config.projects_folder, p)
            if not os.path.isdir(filepath):
                projects.remove(p)

        return projects

    @classmethod
    def current(cls):
        return cls._current_project

    def __init__(self, name : str, load_anki = True, read = True):
        self._protected_lock = True
        self._ready = False

        self.name = name

        self.dirpath = Project.get_dirpath(name)
        self.timedtext_dirpath = Project.get_timedtext_dirpath(name)
        self.json_filepath = Project.get_json_filepath(name)

        self.video_url : str = None
        self.last_access : float = None

        self.anki_file = None

        if(load_anki):
            self.load_anki()

        self._lock()

        if read:
            self.read()

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

        with open(self.json_filepath, "w") as f:
            json.dump(d, f)

    def read(self):
        data = None
        with open(self.json_filepath, "r") as f:
            data = json.load(f)

        self._unlock()

        for key,val in data.items():
            if key in self._properties:
                self.__setattr__(key, val)

        self._lock()

    def load_anki(self):
        self.anki_file = AnkiFile(Project.get_ankifile_filepath(self.name))

    def _update_last_access(self):
        self._unlock()
        self.last_access = time()
        self._lock()

    def list_timedtext(self):
        files = os.listdir(self.timedtext_dirpath)
        tt = [t[len(self._config.timedtext_prefix):-len(self._config.timedtext_suffix)] for t in files]

        return tt

    def save_timedtext(self, lang : str, data):
        filepath = self.get_timedtext_filepath(self.name, lang)

        if os.path.isfile(filepath):
            raise Warning("Foi tentado criar um ficheiro timedtext que já existia: " + filepath)
            return

        with open(filepath, "w") as f:
           json.dump(data, f) 

    def load_timedtext(self, lang):
        lang_list = self.list_timedtext()

        if lang not in lang_list:
            raise Exception("As línguas disponíveis são " + repr(lang_list) + ". Não há alguma que seja " + lang + ".")
        
        with open(self.get_timedtext_filepath(self.name, lang), "r") as file:
            return json.load(file)


    def load_first_timedtext(self):
        if not self.list_timedtext():
            return

        return self.load_timedtext(self.list_timedtext()[0])


def __test():
    config = ProjectConfig("ProjetosDeTeste", "config.json", "anki.txt")
    proj_name = str(random.randint(0, 9999))
    Project.configure(config)
    Project.create_project(proj_name, "queijo")
    Project.open_project(proj_name)

if __name__ == "__main__":
    __test()
