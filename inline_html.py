#!/usr/bin/python3
import base64
import math
import os
import shutil
import simplejson
import subprocess
import sys
import time

# from html.parser import HTMLParser

if sys.getdefaultencoding() != 'utf-8':
    sys.setdefaultencoding('utf-8')

WORKING_DIR = os.getcwd()
INLINED_FOLDER = os.path.join(WORKING_DIR, 'inlined')
VENDORS = {
    # 'applovin': 'mraid.open()',
    # 'crossinstall': 'window.parent.postMessage("click_go", "*")',
    # 'facebook': 'FbPlayableAd.onCTAClick()',
    # 'google': 'ExitApi.exit()',
    # 'unity': 'mraid.open()'
}

settingMatchKey = '{#settings}'
mainMatchKey = '{#main}'
engineMatchKey = '{#cocosengine}'
projectMatchKey = '{#project}'
resMapMatchKey = '{#resMap}'

fileByteList = ['.png', '.jpg', '.mp3', '.ttf', '.plist']
base64PrefixList = {
  '.png' : 'data:image/png;base64,',
  '.jpg' : 'data:image/jpeg;base64,',
  '.mp3' : '',
  '.ttf' : '',
  '.plist' : 'data:text/plist;base64,'
}

def read_in_chunks(filePath):
    extName = os.path.splitext(filePath)[1]
    if extName in fileByteList:
        file_object = open(filePath, 'rb')
        base64Str = base64.b64encode(file_object.read())
        base64Prefix = base64PrefixList[extName]
        if base64Prefix != None:
            base64Str = bytes(base64Prefix, 'utf-8') + base64Str
            return base64Str
    elif extName == '':
        return None

    file_object = open(filePath)
    return file_object.read()

def getResMap(jsonObj, path, resPath):
    fileList = os.listdir(path)
    for fileName in fileList:
        absPath = path + '/' + fileName
        if (os.path.isdir(absPath)):
            getResMap(jsonObj, absPath, resPath)
        elif (os.path.isfile(absPath)):
            dataStr = read_in_chunks(absPath)
            if dataStr != None:
                absPath = 'res' + absPath.replace(resPath, '')
                jsonObj[absPath] = dataStr

def getResMapScript(resPath):
    jsonObj = {}
    getResMap(jsonObj, resPath, resPath)
    jsonStr = simplejson.dumps(jsonObj)
    resStr = str("window.resMap = ") + jsonStr
    return resStr

# This issue is fixed in Cocos Creator 2.x
def fixEngineError(engineStr):
    newEngineStr = engineStr.replace("t.content instanceof Image", "t.content.tagName === \"IMG\"", 1)
    return newEngineStr

def inline_html(current_path, vendor):
    htmlPath = os.path.join(current_path, 'templates/index.html')
    settingScrPath = os.path.join(current_path, '../build/web-mobile/src/settings.js')
    mainScrPath = os.path.join(current_path, 'templates/main.js')
    engineScrPath = os.path.join(current_path, '../build/web-mobile/cocos2d-js-min.js')
    projectScrPath = os.path.join(current_path, '../build/web-mobile/src/project.js')
    resPath = os.path.join(current_path, '../build/web-mobile/res')

    htmlStr = read_in_chunks(htmlPath)
    settingsStr = read_in_chunks(settingScrPath)
    htmlStr = htmlStr.replace(settingMatchKey, settingsStr, 1)

    projectStr = read_in_chunks(projectScrPath)
    if vendor:
        projectStr = projectStr.replace('window.alert("CTA")', VENDORS[vendor])
    htmlStr = htmlStr.replace(projectMatchKey, projectStr, 1)

    mainStr = read_in_chunks(mainScrPath)
    htmlStr = htmlStr.replace(mainMatchKey, mainStr, 1)

    engineStr = read_in_chunks(engineScrPath)
    engineStr = fixEngineError(engineStr)
    htmlStr = htmlStr.replace(engineMatchKey, engineStr, 1)

    resStr = getResMapScript(resPath)
    html_string = htmlStr.replace(resMapMatchKey, resStr, 1)

    # html_string = minify_html(htmlStr)
    new_html_path = save_inlined_file(html_string, vendor)

    targetFileSize = os.path.getsize(new_html_path)
    targetFileSizeInMegabyte = math.ceil(targetFileSize * 1000 / (1024 * 1024)) / 1000

    if vendor:
        print("=================== {} =================== ".format(vendor))
    else:
        print("===================  Original =================== ")
    print("Target file = {}, with size {}M".format(new_html_path, targetFileSizeInMegabyte))

def save_inlined_file(html, vendor):
    if not os.path.exists(INLINED_FOLDER):
        os.mkdir(INLINED_FOLDER)
    if vendor:
        filename = 'index-{}.html'.format(vendor)
    else:
        filename = 'index.html'
    with open(os.path.join(INLINED_FOLDER, filename), 'w') as f:
        f.write(html)
    return os.path.join(INLINED_FOLDER, filename)

def minify_html():
    # TODO: Upgrade this process. Can't find the right python package to handle this process.
    subprocess.run(["npx", "gulp"])

def remove_inlined_folder():
    if os.path.exists(INLINED_FOLDER):
        shutil.rmtree(INLINED_FOLDER)

if __name__ == '__main__':
    try:
        vendor = sys.argv[1:][0]
        inline_html(WORKING_DIR, vendor)
    except:
        inline_html(WORKING_DIR, None)
        for vendor in VENDORS.keys():
            inline_html(WORKING_DIR, vendor)
    minify_html()
    remove_inlined_folder()
