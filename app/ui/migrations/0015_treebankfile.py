# Generated by Django 4.0.3 on 2022-08-31 15:50

from django.db import migrations, models
import ui.models


class Migration(migrations.Migration):

    dependencies = [
        ('ui', '0014_treebank_language_alter_sentence_unique_together'),
    ]

    operations = [
        migrations.CreateModel(
            name='TreebankFile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('file', models.FileField(upload_to=ui.models.user_directory_path)),
            ],
        ),
    ]
