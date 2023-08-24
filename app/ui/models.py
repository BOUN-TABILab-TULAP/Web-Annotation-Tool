from django.db import models
from django.contrib.auth.models import User
import datetime

def user_directory_path(_, filename):
    filename_parts = filename.split('.')
    if len(filename_parts) > 1: extension = '.' + filename_parts[-1]; filename = filename_parts[:-1]
    else: extension = ''
    return 'treebank_uploads/{0}_{1}{2}'.format(filename, datetime.datetime.now().strftime('%Y%m%d%H%M%S'), extension)

class TreebankFile(models.Model):
    file = models.FileField(upload_to=user_directory_path)

class ExtendUser(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE,)
    # error_condition: 1 (shown), 0 (hidden)
    # graph: conllu.js 1, treex 2, spacy 3, none 0
    preferences = models.JSONField(blank=True)

    def __str__(self):
        return self.user.username

class TreebankManager(models.Manager):
    def get_treebank_from_title(self, title):
        treebanks = Treebank.objects.all()
        for treebank_t in treebanks:
            if treebank_t.title == title: return treebank_t
        return None
    
    def get_treebank_from_url(self, url):
        treebanks = Treebank.objects.all()
        for treebank_t in treebanks:
            if treebank_t.title.replace(' ', '-') == url: return treebank_t
        return None

class Treebank(models.Model):
    title = models.CharField(max_length=30, unique=True)
    language = models.CharField(max_length=30)

    def __str__(self):
        return self.title

    objects = TreebankManager()

class SentenceManager(models.Manager):
    def create_sentence(self, treebank, sent_id, text, comments={}):
        if len(Sentence.objects.filter(treebank=treebank)) == 0: next_order = 1
        else: next_order = list(Sentence.objects.filter(treebank=treebank).order_by('order'))[-1].order + 1
        sentence = self.create(order=next_order, treebank=treebank, sent_id=sent_id, text=text, comments=comments)
        return sentence

class Sentence(models.Model):
    class Meta:
        unique_together = ['sent_id', 'text', 'treebank']

    order = models.PositiveIntegerField()
    treebank = models.ForeignKey(Treebank, on_delete=models.CASCADE)
    sent_id = models.CharField(max_length=30)
    text = models.TextField()
    comments = models.JSONField(blank=True)

    objects = SentenceManager()

    def __str__(self):
        return self.sent_id

class AnnotationManager(models.Manager):
    def create_annotation(self, annotator, sentence, notes='', status=0):
        annotation = self.create(annotator=annotator, sentence=sentence, notes=notes, status=status)
        return annotation

class Annotation(models.Model):
    annotator = models.ForeignKey(User, on_delete=models.CASCADE)
    sentence = models.ForeignKey(Sentence, on_delete=models.CASCADE)
    notes = models.TextField()
    status = models.CharField(max_length=20)

    objects = AnnotationManager()

    def __str__(self):
        return '%s by %s' % (self.sentence.sent_id, self.annotator)

class Word_LineManager(models.Manager):
    def create_word_line(self, annotation, id_f, form, lemma, upos, xpos, feats, head, deprel, deps, misc):
        word_line = self.create(annotation=annotation, id_f=id_f, form=form, lemma=lemma, upos=upos, xpos=xpos, feats=feats, head=head, deprel=deprel, deps=deps, misc=misc)
        return word_line

class Word_Line(models.Model):
    annotation = models.ForeignKey(Annotation, on_delete=models.CASCADE)
    id_f = models.CharField(max_length=10)
    form = models.CharField(max_length=100)
    lemma = models.CharField(max_length=100)
    upos = models.CharField(max_length=100)
    xpos = models.CharField(max_length=100)
    feats = models.CharField(max_length=500)
    head = models.CharField(max_length=100)
    deprel = models.CharField(max_length=100)
    deps = models.CharField(max_length=100)
    misc = models.CharField(max_length=200)

    objects = Word_LineManager()

    def __str__(self):
        return '%s, ID: %s' % (self.annotation, self.id_f)
