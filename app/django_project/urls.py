"""django_project URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from search import views
from .settings import ROOT_PATH

router = routers.DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'groups', views.GroupViewSet)
router.register(r'treebanks', views.TreebankViewSet)
router.register(r'sentences', views.SentenceViewSet)
router.register(r'annotations', views.AnnotationViewSet)
router.register(r'wordlines', views.WordLineViewSet)

urlpatterns = [
    path(f'{ROOT_PATH}admin/', admin.site.urls),
    path(f'{ROOT_PATH}', include('ui.urls')),
    # path('', include('search.urls')),
    path(f'{ROOT_PATH}query/', views.query, name='query'),
    path(f'{ROOT_PATH}api/my_annotations/', views.my_annotations, name='my_annos'),
    path(f'{ROOT_PATH}api/get_treebank/', views.get_treebank, name='get_treebank'),
    path(f'{ROOT_PATH}api/get_annotations/', views.get_annotations, name='get_annotations'),
    path(f'{ROOT_PATH}api/', include(router.urls)),
    path(f'{ROOT_PATH}api-auth/', include('rest_framework.urls', namespace='rest_framework'))
]
