from django.contrib import admin
from .models import Treebank, Sentence, Annotation, Word_Line, ExtendUser

admin.site.register(Treebank)
admin.site.register(Sentence)
admin.site.register(Annotation)
admin.site.register(Word_Line)
admin.site.register(ExtendUser)