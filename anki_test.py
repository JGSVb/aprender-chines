import anki
from anki.errors import *
from anki.collection import Collection
from aqt.profiles import ProfileManager

def get_profile_manager():
    base_folder = ProfileManager.get_created_base_folder(None)
    pm = ProfileManager(base_folder)
    pmLoadResult = pm.setupMeta()

    return pm

def get_backend():
    lang = anki.lang.get_def_lang()
    anki.lang.set_lang(lang[1])

    return anki.lang.current_i18n

def open_collection(pm):
    backend = get_backend()

    col_path = pm.collectionPath()
    
    Collection.initialize_backend_logging()
    return Collection(col_path, backend)

def main():
    pm = get_profile_manager()

    profiles = pm.profiles()
    pm.openProfile(profiles[0])

    col = open_collection(pm)
    decks = col.decks.all_names_and_ids()

    for d in decks:
        print(d.id, d.name)

if __name__ == "__main__":
    main()
