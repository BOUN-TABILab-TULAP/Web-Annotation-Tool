# Generated by Django 4.0.3 on 2022-03-19 13:00

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('ui', '0002_delete_annotator'),
    ]

    operations = [
        migrations.CreateModel(
            name='Treebank',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=30, unique=True)),
            ],
        ),
        migrations.CreateModel(
            name='Sentence',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('sent_id', models.CharField(max_length=30)),
                ('text', models.TextField()),
                ('comments', models.JSONField(blank=True)),
                ('treebank', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='ui.treebank')),
            ],
        ),
        migrations.CreateModel(
            name='Annotation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('cats', models.JSONField()),
                ('notes', models.TextField(blank=True)),
                ('annotator', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
                ('sentence', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='ui.sentence')),
            ],
        ),
    ]
