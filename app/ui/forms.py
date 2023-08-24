from django import forms
from django.forms import ModelForm
from .models import Treebank, Sentence, Annotation, TreebankFile

class UploadFileForm(ModelForm):
    class Meta:
        model = TreebankFile
        fields = ['file']

class TreebankForm(ModelForm):
    class Meta:
        model = Treebank
        fields = ['title', 'language']

class SentenceForm(ModelForm):
    class Meta:
        model = Sentence
        fields = ['treebank', 'sent_id', 'text', 'comments']

class AnnotationForm(ModelForm):
    class Meta:
        model = Annotation
        fields = ['annotator', 'sentence']
