from django.contrib.auth.models import User, Group
from rest_framework import serializers
from ui.models import Treebank, Sentence, Annotation, Word_Line

class TreebankSerializer(serializers.ModelSerializer):
    class Meta:
        model = Treebank
        fields = ['url', 'id', 'title']

class SentenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sentence
        fields = ['url', 'id', 'order', 'treebank', 'sent_id', 'text', 'comments']
    
class AnnotationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Annotation
        fields = ['url', 'id', 'annotator', 'sentence', 'notes', 'status']

class WordLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Word_Line
        fields = ['url', 'id', 'id_f', 'annotation', 'form', 'lemma', 'upos', 'xpos', 'feats', 'head', 'deprel', 'deps', 'misc']

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['url', 'id', 'username', 'email', 'groups']

class GroupSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Group
        fields = ['url', 'name']