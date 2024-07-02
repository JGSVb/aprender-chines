import os
import json
import random
from time import time
from anki_utils import *

class ProjectConfig:

	root_folder = "Projetos"

	timedtext_folder = "./timedtext"
	images_folder = "./data/images"

	folders = [
			timedtext_folder,
			images_folder]

	anki_file = "anki.txt"
	config_file = "config.json"

	files = [
			anki_file,
			config_file]

	timedtext_file_prefix = "timedtext_"
	timedtext_file_suffix = ".json"


class Project:
	_current_project = None

	@staticmethod
	def cmp_func_last_access(name : str):
		p = Project(name)
		p.load_config()
		return p.get("last_access")

	@classmethod
	def get_projects(cls):
		projects = os.listdir(ProjectConfig.root_folder)
		for p in projects:
			filepath = os.path.join(ProjectConfig.root_folder, p)
			if not os.path.isdir(filepath):
				projects.remove(p)

		return projects

	@classmethod
	def create_project(cls, name : str, video_url : str):
		if name in cls.get_projects():
			raise Exception(f"Projeto existe: {name}")

		p = Project(name)
		p.set("video_url", video_url)
		p.set("last_access", time())
		p.write()

		cls._current_project = p

		return p

	@classmethod
	def open_project(cls, name):
		p = Project(name)
		p.load_all()
		p.set("last_access", time())

		cls._current_project = p

		return p

	@classmethod
	def close_project(cls):
		cls._current_project = None

	@classmethod
	def current(cls):
		return cls._current_project

	def __init__(self, name : str):
		self._protected_lock = True

		self.name = name

		self.project_dirpath = os.path.join(ProjectConfig.root_folder, name)
		self.timedtext_dirpath = os.path.join(self.project_dirpath, ProjectConfig.timedtext_folder)
		self.config_filepath = os.path.join(self.project_dirpath, ProjectConfig.config_file)
		self.anki_filepath = os.path.join(self.project_dirpath, ProjectConfig.anki_file)

		self.video_url = None
		self.last_access = None

		self.properties = {
				"video_url": None,
				"last_access": None}

		self.anki_file = None

	def _lock(self):
		self._protected_lock = True

	def _unlock(self):
		self._protected_lock = False

	def get(self, name):
		return self.properties[name]

	def set(self, name, value):
		self.properties[name] = value
		self.write()

	def write(self):
		
		if not os.path.isdir(self.project_dirpath):
			os.makedirs(self.project_dirpath)

		for folder in ProjectConfig.folders:
			path = os.path.join(self.project_dirpath, folder)

			if not os.path.isdir(path):
				os.makedirs(path)

		for file in ProjectConfig.files:
			path = os.path.join(self.project_dirpath, file)

			if not os.path.isfile(path):
				open(path, "w").close()

		with open(self.config_filepath, "w") as f:
			json.dump(self.properties, f)

	def load_config(self):
		data = None
		with open(self.config_filepath, "r") as f:
			data = json.load(f)

		self.properties = data

	def load_anki(self):
		self.anki_file = AnkiFile(self.anki_filepath)

	def load_all(self):
		self.load_config()
		self.load_anki()

	def get_timedtext_filepath(self, lang):
		filename = ProjectConfig.timedtext_file_prefix + lang + ProjectConfig.timedtext_file_suffix

		return os.path.join(
				self.project_dirpath,
				ProjectConfig.timedtext_folder,
				filename)

	def list_timedtext(self):
		files = os.listdir(self.timedtext_dirpath)
		tt = [t[len(ProjectConfig.timedtext_file_prefix):-len(ProjectConfig.timedtext_file_suffix)] for t in files]

		return tt

	def save_timedtext(self, lang : str, data):
		filepath = self.get_timedtext_filepath(lang)

		if os.path.isfile(filepath):
			raise Warning("Foi tentado criar um ficheiro timedtext que já existia: " + filepath)

		with open(filepath, "w") as f:
			json.dump(data, f) 

	def load_timedtext(self, lang):
		lang_list = self.list_timedtext()

		if lang not in lang_list:
			raise Exception("As línguas disponíveis são " + repr(lang_list) + ". Não há alguma que seja " + lang + ".")
		
		with open(self.get_timedtext_filepath(lang), "r") as file:
			return json.load(file)


	def load_first_timedtext(self):
		if not self.list_timedtext():
			return

		return self.load_timedtext(self.list_timedtext()[0])


def __test():
	proj_name = str(random.randint(0, 9999))
	Project.create_project(proj_name, "queijo")
	Project.open_project(proj_name)

if __name__ == "__main__":
	__test()
