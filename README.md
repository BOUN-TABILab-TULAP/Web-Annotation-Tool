# Web Annotation Tool

A Collaborative Web Tool for Linguistic Annotation

The web-based Bogazici Annotation Tool (BoAT) supports grammar annotation especially suitable for morphologically rich languages (MRLs). It is useful for creating treebanks and conforms to Universal Dependencies (UD) framework.

A user can upload and annotate a treebank by providing values for UD CoNLL-U tags (ID, FORM, LEMMA, UPOS, XPOS, FEATS, HEAD, DEPREL, DEPS, MISC). Furthermore, lemmas can be split and tagged, which is useful for MRLs like Turkish.

This tool also provides support for sharing experiences among annotators with a rich search feature. It also supports the computation of inter-annotator agreement scores.

This tool easily can be built with the following instructions:

Prerequisite:  
Make sure that Docker is installed and running on your system.
See [docs.docker.com/get-docker](https://docs.docker.com/get-docker/) for installation instructions for your system.

1. Obtain the code using one of the following methods:
    - Download from the URL [github.com/BOUN-TABILab-TULAP/Web-Annotation-Tool/archive/refs/heads/main.zip](https://github.com/BOUN-TABILab-TULAP/Web-Annotation-Tool/archive/refs/heads/main.zip) and unzip
    - Use Git by `git clone https://github.com/BOUN-TABILab-TULAP/Web-Annotation-Tool.git`
2. Go to the newly created directory (if using zip the directory should be 'Web-Annotation-Tool-main'. If using Git, the directory should be 'Web-Annotation-Tool').
3. Build the tool with the command `docker compose up --build -d`
4. Open [localhost:8000](http://localhost:8000) on your browser to start the web annotation tool.
