from django import forms
from django.forms import ModelForm
from .models import Treebank, Sentence, Annotation

class UploadFileForm(forms.Form):
    title = forms.CharField(max_length=50)
    file = forms.FileField()

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
