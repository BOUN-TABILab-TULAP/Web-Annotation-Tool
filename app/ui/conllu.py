import re, subprocess, os, sys

THISDIR = os.path.dirname(os.path.realpath(__file__))

def validate_uploaded_file(f):
    file_text = None
    try:
        for chunk in f.chunks():
            if file_text == None: file_text = chunk
            else: file_text += chunk
        file_text = file_text.decode('utf-8')
        sentence_pattern = r'(?:#.+=.+\n)+(?:(?:.+\t){9}.+\n)+'
        file_text = re.sub(sentence_pattern, '', file_text)
    except: return False
    if file_text.strip() == '': return True
    else: return False

def parse_file(f):
    file_text = None
    for chunk in f.chunks():
        if file_text == None: file_text = chunk
        else: file_text += chunk
    file_text = file_text.decode('utf-8')
    sentence_pattern = r'(?:#.+=.+\n)+(?:(?:.+\t){9}.+\n)+'
    sentences_found = re.findall(sentence_pattern, file_text)
    sentences = []
    comment_pattern = r'#(.+)=(.+)'
    cats = ['form', 'lemma', 'upos', 'xpos', 'feats', 'head', 'deprel', 'deps', 'misc']
    cats_pattern = r'(?:.+\t){9}.+'
    for curr_sentence in sentences_found:
        sentence = {}
        for line in curr_sentence.split('\n'):
            if line.startswith('#'):
                comment_found = re.match(comment_pattern, line)
                if comment_found and len(comment_found.groups()) == 2:
                    if comment_found.group(1).strip() not in ['sent_id', 'text']:
                        if 'comments' not in sentence.keys():
                            sentence['comments'] = dict()
                        sentence['comments'][comment_found.group(1).strip()] = comment_found.group(2).strip()
                    else:
                        sentence[comment_found.group(1).strip()] = comment_found.group(2).strip()
                else: print(curr_sentence)
            else:
                cats_found = re.match(cats_pattern, line)
                if cats_found:
                    cats_t = cats_found.group().strip().split('\t')
                    id_t = cats_t[0]
                    sentence[id_t] = dict()
                    for i in range(1, 10):
                        cat_t = cats_t[i]
                        sentence[id_t][cats[i-1]] = cat_t
        sentences.append(sentence)
    return sentences

def get_errors(sent_id, text, content):
    input = f'# sent_id = {sent_id}\n'
    input += f'# text = {text}\n'
    order = ['form', 'lemma', 'upos', 'xpos', 'feats', 'head', 'deprel', 'deps'] # id & misc removed
    con_keys = list(content.keys())
    keys = []
    for key in range(1, len(con_keys)*2):
        if f'{key}-{key+1}' in con_keys:
            keys.append(f'{key}-{key+1}')
        if f'{key}' in con_keys:
            keys.append(f'{key}')
    for key in keys:
        input += f'{key}\t' # id
        for i in range(8):
            input += f'{content[key][order[i]]}\t'
        input += f'{content[key]["misc"]}\n' # misc
    input += '\n'
    return subprocess.run([sys.executable, os.path.join(THISDIR, 'validate.py'), '--lang', 'tr'], input=input, encoding='utf-8', capture_output=True).stderr
