from spacy import displacy

def get_dep_graph(sentence):
    manual = {"words": [], "arcs": [], "lemmas": []}
    keys = list(sentence.keys())
    word_count_t = len(keys)
    dep_count = 0
    for i in range(len(keys)):
        id_t = keys[i]
        fields = sentence[id_t]
        if '-' in id_t: continue
        manual['words'].append({"text": fields['form'], "tag": fields['upos'], "lemma": id_t})
        if fields['deprel'] == '_' or fields['head'] in ['_', '0']: continue
        head_int = int(fields['head'])-1
        if i > head_int:
            direction = 'left'
            start, end = head_int, i
        else:
            direction = 'right'
            end, start = head_int, i
        manual['arcs'].append({
            "start": start, "end": end, "label": fields['deprel'], "dir": direction
        })
        dep_count += 1
    if dep_count == 0: return ''

    return displacy.render(docs=manual, style="dep", manual=True, options={'compact':'True', 'add_lemma': 'True', 'distance': 100})