print("cedict_parser: https://github.com/rubber-duck-dragon/rubber-duck-dragon.github.io/blob/master/cc-cedict_parser/parser.py")

def parse(filename):
    with open(filename) as file:
        text = file.read()
        lines = text.split('\n')
        dict_lines = list(lines)

#define functions

        def parse_line(line):
            parsed = {}
            if line == '':
                dict_lines.remove(line)
                return 0
            line = line.rstrip('/')
            line = line.split('/')
            if len(line) <= 1:
                return 0
            english = line[1]
            char_and_pinyin = line[0].split('[')
            characters = char_and_pinyin[0]
            characters = characters.split()
            traditional = characters[0]
            simplified = characters[1]
            pinyin = char_and_pinyin[1]
            pinyin = pinyin.rstrip()
            pinyin = pinyin.rstrip("]")
            parsed['traditional'] = traditional
            parsed['simplified'] = simplified
            parsed['pinyin'] = pinyin
            parsed['english'] = english
            list_of_dicts.append(parsed)

        def remove_surnames():
            for x in range(len(list_of_dicts)-1, -1, -1):
                if "surname " in list_of_dicts[x]['english']:
                    if list_of_dicts[x]['traditional'] == list_of_dicts[x+1]['traditional']:
                        list_of_dicts.pop(x)

        def main():

            #make each line into a dictionary
            print("Parsing dictionary . . .")
            for line in dict_lines:
                    parse_line(line)

            #remove entries for surnames from the data (optional):

            # print("Removing Surnames . . .")
            # remove_surnames()

            print('Done!')

            return list_of_dicts

    list_of_dicts = []
    parsed_dict = main()
    return parsed_dict
