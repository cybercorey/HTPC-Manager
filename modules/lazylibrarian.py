#!/usr/bin/env python
# -*- coding: utf-8 -*-

import cherrypy
import htpc
import logging
import requests
import hashlib
from cherrypy.lib.auth2 import require, member_of
from urllib import urlencode
from json import loads
from htpc.helpers import get_image, striphttp


class Lazylibrarian(object):
    def __init__(self):
        self.logger = logging.getLogger('modules.lazylibrarian')
        htpc.MODULES.append({
            'name': 'Lazylibrarian',
            'id': 'lazylibrarian',
            'test': htpc.WEBDIR + 'lazylibrarian/ping',
            'fields': [
                {'type': 'bool', 'label': 'Enable', 'name': 'lazylibrarian_enable'},
                {'type': 'text', 'label': 'Menu name', 'name': 'lazylibrarian_name'},
                {'type': 'text', 'label': 'Username', 'name': 'lazylibrarian_username'},
                {'type': 'password', 'label': 'Password', 'name': 'lazylibrarian_password'},
                {'type': 'text', 'label': 'IP / Host *', 'name': 'lazylibrarian_host'},
                {'type': 'text', 'label': 'Port *', 'name': 'lazylibrarian_port'},
                {'type': 'text', 'label': 'Basepath', 'name': 'lazylibrarian_basepath'},
                {'type': 'text', 'label': 'API key', 'name': 'lazylibrarian_apikey'},
                {'type': 'bool', 'label': 'Use SSL', 'name': 'lazylibrarian_ssl'},
                {'type': 'text', "label": 'Reverse proxy link', 'placeholder': '', 'desc': 'Reverse proxy link ex: https://domain.com/hp', 'name': 'lazylibrarian_reverse_proxy_link'}

            ]
        })

    @cherrypy.expose()
    @require()
    def index(self):
        template = htpc.LOOKUP.get_template('lazylibrarian.html')
        settings = htpc.settings

        return template.render(
            scriptname='lazylibrarian',
            settings=settings,
            url=self.webinterface(),
            name=settings.get('lazylibrarian_name', 'Lazylibrarian')
        )

    def webinterface(self):
        url = Lazylibrarian._build_url()
        if htpc.settings.get('lazylibrarian_reverse_proxy_link'):
            url = htpc.settings.get('lazylibrarian_reverse_proxy_link')
        return url

    @cherrypy.expose()
    @require()
    def GetThumb(self, url=None, thumb=None, h=None, w=None, o=100):
        """ Parse thumb to get the url and send to htpc.proxy.get_image """
        self.logger.debug("Trying to fetch image via %s" % url)
        if url is None and thumb is None:
            # To stop if the image is missing
            return
        # Should never used thumb, to lazy to remove it
        if thumb:
            url = thumb
        return get_image(url, h, w, o)

    #@cherrypy.expose()
    #@require()
    #def viewAuthor(self, author_id):
    #    response = self.fetch('getAuthor&id=%s' % author_id)

    #    for a in response['books']:
    #        a['StatusText'] = _get_status_icon(a['Status'])
    #        a['can_download'] = True if a['Status'] not in ('Downloaded', 'Snatched', 'Wanted') else False
    #        a['can_skip'] = True if a['Status'] not in ('Downloaded', 'Snatched', 'Skipped') else False
    #        a['can_trynew'] = True if a['Status'] in ('Snatched') else False

    #    template = htpc.LOOKUP.get_template('lazylibrarian_view_author.html')

    #    return template.render(
    #        scriptname='lazylibrarian_view_author',
    #        author_id=author_id,
    #        author=response['author'][0],
    #        authorimg=response['author'][0]['ArtworkURL'],
    #        books=response['books'],
    #        description=response['description'][0],
    #        module_name=htpc.settings.get('lazylibrarian_name') or 'Lazylibrarian',
    #    )

    @cherrypy.expose()
    @require()
    def viewBook(self, book_id):
        response = self.fetch('getBook&id=%s' % book_id)

        tracks = response['tracks']
        for t in tracks:
            duration = t['TrackDuration']
            total_seconds = duration / 1000
            minutes = total_seconds / 60
            seconds = total_seconds - (minutes * 60)
            t['DurationText'] = '%d:%02d' % (minutes, seconds)
            t['TrackStatus'] = _get_status_icon('Downloaded' if t['Location'] is not None else '')

        template = htpc.LOOKUP.get_template('lazylibrarian_view_book.html')
        return template.render(
            scriptname='lazylibrarian_view_book',
            author_id=response['book'][0]['AuthorID'],
            book_id=book_id,
            bookimg=response['book'][0]['ArtworkURL'],
            module_name=htpc.settings.get('lazylibrarian_name', 'Lazylibrarian'),
            book=response['book'][0],
            tracks=response['tracks'],
            description=response['description'][0]
        )

    @staticmethod
    def _build_url(ssl=None, host=None, port=None, base_path=None):
        ssl = ssl or htpc.settings.get('lazylibrarian_ssl')
        host = host or htpc.settings.get('lazylibrarian_host')
        port = port or htpc.settings.get('lazylibrarian_port')
        base_path = base_path or htpc.settings.get('lazylibrarian_basepath')

        username = htpc.settings.get('lazylibrarian_username', '')
        password = htpc.settings.get('lazylibrarian_password', '')

        if username and password:
            authstring = '%s:%s@' % (username, password)
        else:
            authstring = ''


        path = base_path or '/'
        if path.startswith('/') is False:
            path = '/' + path
        if path.endswith('/') is False:
            path += '/'

        url = '{protocol}://{authstring}{host}:{port}{path}'.format(
            authstring=authstring,
            protocol='https' if ssl else 'http',
            host=striphttp(host),
            port=port,
            path=path,
        )

        return url

    @staticmethod
    def _build_api_url(command, url=None, api_key=None):
        return '{url}api?apikey={api_key}&cmd={command}'.format(
            url=url or Lazylibrarian._build_url(),
            api_key=api_key or htpc.settings.get('lazylibrarian_apikey'),
            command=command,
        )

    @cherrypy.expose()
    @cherrypy.tools.json_out()
    @require()
    def GetAuthorList(self):
        return self.fetch('getIndex')

    @cherrypy.expose()
    @cherrypy.tools.json_out()
    @require()
    def GetWantedList(self):
        return self.fetch('getWanted')
        
    @cherrypy.expose()
    @cherrypy.tools.json_out()
    @require()
    def GetUpcomingList(self):
        return self.fetch('getUpcoming')

    @cherrypy.expose()
    @cherrypy.tools.json_out()
    @require()
    def SearchForAuthor(self, name, searchtype):
        if searchtype == "authorId":
            return self.fetch('findAuthor&%s' % urlencode({'name': name.encode(encoding='UTF-8',errors='strict')}))
        else:
            return self.fetch('findBook&%s' % urlencode({'name': name.encode(encoding='UTF-8',errors='strict')}))

    @cherrypy.expose()
    @require(member_of(htpc.role_user))
    def RefreshAuthor(self, authorId):
        return self.fetch('refreshAuthor&id=%s' % authorId, text=True)

    @cherrypy.expose()
    @require(member_of(htpc.role_user))
    def DeleteAuthor(self, authorId):
        return self.fetch('delAuthor&id=%s' % authorId, text=True)

    @cherrypy.expose()
    @require(member_of(htpc.role_user))
    def PauseAuthor(self, authorId):
        return self.fetch('pauseAuthor&id=%s' % authorId, text=True)

    @cherrypy.expose()
    @require(member_of(htpc.role_user))
    def ResumeAuthor(self, authorId):
        return self.fetch('resumeAuthor&id=%s' % authorId, text=True)

    @cherrypy.expose()
    @require()
    def QueueBook(self, bookId, new=False):
        # == Force check
        if new:
            return self.fetch('queueBook&id=%s&new=True' % bookId, text=True)
        return self.fetch('queueBook&id=%s' % bookId, text=True)

    @cherrypy.expose()
    @require(member_of(htpc.role_user))
    def UnqueueBook(self, bookId):
        return self.fetch('unqueueBook&id=%s' % bookId, text=True)

    @cherrypy.expose()
    @cherrypy.tools.json_out()
    @require()
    def AddAuthor(self, id, searchtype, **kwargs):
        if searchtype == "authorId":
            return self.fetch('addAuthor&name=%s' % id)
        else:
            return self.fetch('addBook&id=%s' % id)

    @cherrypy.expose()
    @cherrypy.tools.json_out()
    @require()
    def GetHistoryList(self):
        return self.fetch('getHistory')

    @cherrypy.expose()
    @require()
    def GetBookArt(self, id):
        return self.fetch('getBookArt&id=%s' % id, img=True)

    @cherrypy.expose()
    @require()
    def GetBook(self, id):
        return self.fetch('getBook&id=%s' % id)

    @cherrypy.expose()
    @require(member_of(htpc.role_user))
    def ForceSearch(self):
        return self.fetch('forceSearch', text=True)

    @cherrypy.expose()
    @require(member_of(htpc.role_user))
    def ForceProcess(self, dir=None):
        if dir:
            return self.fetch('forceProcess?dir=%s' % dir, text=True)
        return self.fetch('forceProcess', text=True)

    @cherrypy.expose()
    @require(member_of(htpc.role_user))
    def ForceActiveAuthorsUpdate(self):
        return self.fetch('forceActiveAuthorsUpdate', text=True)

    @cherrypy.expose()
    @require(member_of(htpc.role_user))
    def ShutDown(self):
        return self.fetch('shutdown', text=True)

    @cherrypy.expose()
    @require(member_of(htpc.role_user))
    def UpDate(self):
        return self.fetch('update', text=True)

    @cherrypy.expose()
    @require(member_of(htpc.role_user))
    def ReStart(self):
        return self.fetch('restart', text=True)

    @cherrypy.expose()
    @cherrypy.tools.json_out()
    @require()
    def Choose_Specific_Download(self, id):
        return self.fetch('choose_specific_download&id=%s' % id)

    @cherrypy.expose()
    @cherrypy.tools.json_out()
    @require()
    def Download_Specific_Release(self, id, title, size, url, provider, kind):
        return self.fetch('download_specific_release&id=%s&title=%s&size=%s&url=%s&provider=%s&kind=%s' %(id, title, size, url, provider, kind))

    def fetch(self, command, url=None, api_key=None, img=False, json=True, text=False):
        url = Lazylibrarian._build_api_url(command, url, api_key)
        try:
            # So shitty api..
            if img or text:
                json = False
            result = ''
            self.logger.debug('calling api @ %s' % url)
            response = requests.get(url, timeout=30, verify=False)

            if response.status_code != 200:
                response.raise_for_status()
                self.logger.error('failed to contact lazylibrarian')
                return

            if text:
                result = response.text

            if img:
                result = response.content

            if json:
                result = response.json()

            self.logger.debug('Response: %s' % result)

            return result

        except Exception as e:
            self.logger.error("Error calling api %s: %s" % (url, e))

    @cherrypy.expose()
    @cherrypy.tools.json_out()
    @require()
    def ping(self,
             lazylibrarian_enable, lazylibrarian_name,
             lazylibrarian_host, lazylibrarian_port,
             lazylibrarian_basepath,
             lazylibrarian_apikey,
             lazylibrarian_ssl=False,
             **kwargs):

        self.logger.debug('Attemping to ping lazylibrarian')

        url = Lazylibrarian._build_url(
            lazylibrarian_ssl,
            lazylibrarian_host,
            lazylibrarian_port,
            lazylibrarian_basepath,
        )

        return self.fetch('getVersion', url, lazylibrarian_apikey)


def _get_status_icon(status):
    green = ["Downloaded", "Active", "Processed"]
    orange = ["Snatched"]
    blue = ["Wanted"]
    red = ["Unprocessed"]

    mapsicon = {
        'Downloaded': 'fa fa-download',
        'Active': 'fa fa-rotate-right',
        'Error': 'fa fa-bell-o',
        'Paused': 'fa fa-pause',
        'Snatched': 'fa fa-share-alt',
        'Skipped': 'fa fa-fast-forward',
        'Wanted': 'fa fa-heart',
        'Processed': 'fa fa-check',
        'Unprocessed': 'fa fa-exclamation-circle'
    }

    if not status:
        return ''

    label = ''
    if status in green:
        label = 'label-success'
    elif status in orange:
        label = 'label-warning'
    elif status in blue:
        label = 'label-info'
    elif status in red:
        label = 'label-error'
    else:
        pass

    fmt = '<span class="label %s"><i class="%s fa-inverse"></i> %s</span>'

    return fmt % (label, mapsicon[status], status)
