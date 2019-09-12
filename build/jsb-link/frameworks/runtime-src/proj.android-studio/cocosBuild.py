'''
放在cocos工程 ./build/jsb-link/frameworks/runtime-src/proj.android-studio/ 目录下
执行 python3 cocosBuild.py 项目名称 热更地址 版本号
eg. python3 cocosBuild.py DaFaGame http://cdn-h5-dafa-game.loyuco.com/game-res/ 1.0.0
'''

import subprocess
import sys
import os
import re


class buildXcode:
    def __init__(self, projectName, projectPath):
        self.projectName = projectName
        self.projectPath = projectPath + \
            '/build/jsb-link/frameworks/runtime-src/proj.ios_mac/'
        self.rootPath = projectPath

    def cleanProject(self):
        cleanCmd = 'rm -rf ' + self.projectPath + '/exports'
        process = subprocess.Popen(cleanCmd, shell=True)
        process.wait()

        createCmd = 'mkdir -p ' + self.projectPath + '/exports'
        process = subprocess.Popen(createCmd, shell=True)
        process.wait()

    def buildProject(self):
        archiveCmd = 'xcodebuild archive -project ' + self.projectPath + self.projectName + '.xcodeproj -scheme ' + \
            self.projectName + '-mobile -archivePath ' + self.projectPath + \
            'exports/' + self.projectName + '.xcarchive'
        process = subprocess.Popen(archiveCmd, shell=True)
        process.wait()

    def exportProject(self):
        ipaCmd = 'xcodebuild -exportArchive -archivePath ' + self.projectPath + 'exports/' + self.projectName + \
            '.xcarchive -exportPath ' + self.projectPath + \
            'exports/ -exportOptionsPlist ' + self.projectPath + 'ios/Info.plist'
        process = subprocess.Popen(ipaCmd, shell=True)
        process.wait()

    def moveProject(self):
        createCmd = 'mkdir -p ' + self.rootPath + '/build/exports'
        process = subprocess.Popen(createCmd, shell=True)
        process.wait()

        moveCmd = 'mv ' + self.projectPath + 'exports/' + self.projectName + \
            '-mobile.ipa ' + self.rootPath + '/build/exports'
        process = subprocess.Popen(moveCmd, shell=True)
        process.wait()


class buildAndroid:
    def __init__(self, projectName, projectPath):
        self.projectName = projectName
        self.projectPath = projectPath + \
            '/build/jsb-link/frameworks/runtime-src/proj.android-studio/'
        self.rootPath = projectPath

    def buildProject(self):
        archiveCmd = './gradlew assembleRelease'
        process = subprocess.Popen(archiveCmd, shell=True)
        process.wait()

    def moveProject(self):
        createCmd = 'mkdir -p ' + self.rootPath + '/build/exports'
        process = subprocess.Popen(createCmd, shell=True)
        process.wait()

        moveCmd = 'mv ' + self.projectPath + 'app/build/outputs/apk/release/' + \
            self.projectName + '-release.apk ' + self.rootPath + '/build/exports'
        process = subprocess.Popen(moveCmd, shell=True)
        process.wait()


class buildMain:
    def structureProject(projectPath):
        structureCmd = '/Applications/CocosCreator.app/Contents/MacOS/CocosCreator --path ' + \
            projectPath + '/ --build "platform=android"'

    def loginFirIm():
        loginFirCmd = 'fir login 8b48580b8bff2e04a9de7dc5c3dc7488'
        process = subprocess.Popen(loginFirCmd, shell=True)
        process.wait()

    def updateVersion(projectName, projectPath, hotUrl, version):
        versionCmd = 'node ' + projectPath + '/version_generator.js -s ' + projectPath + \
            '/build/jsb-link -d ' + projectPath + '/assets -u ' + hotUrl + ' -v ' + version
        print(versionCmd)
        process = subprocess.Popen(versionCmd, shell=True)
        process.wait()

        cpVersionFileCmd = 'cp ' + projectPath + \
            '/assets/version.manifest ' + projectPath + '/build/jsb-link/'
        process = subprocess.Popen(cpVersionFileCmd, shell=True)
        process.wait()

        cpProjectFileCmd1 = 'cp ' + projectPath + \
            '/assets/project.manifest ' + projectPath + '/build/jsb-link/'
        process = subprocess.Popen(cpProjectFileCmd1, shell=True)
        process.wait()

        cpProjectFileCmd2 = 'cp ' + projectPath + '/assets/project.manifest ' + \
            projectPath + '/build/jsb-link/res/raw-assets'
        process = subprocess.Popen(cpProjectFileCmd2, shell=True)
        process.wait()

    def buildXcodeProject(projectName, projectPath):
        buildPro = buildXcode(projectName, projectPath)

        buildPro.cleanProject()
        buildPro.buildProject()
        buildPro.exportProject()
        buildPro.moveProject()

    def buildAndroidProject(projectName, projectPath):
        buildPro = buildAndroid(projectName, projectPath)
        buildPro.buildProject()
        buildPro.moveProject()


if __name__ == '__main__':
    print(re.match('http://(.*)/', sys.argv[2]))
    if(re.match('http://(.*)/', sys.argv[2]) == None or re.match('http://(.*)/', sys.argv[2]).span() == None):
        print("\033[0;37;41m\t热更地址格式不正确请检查\033[0m")
        sys.exit()
    cocosProjectPath = os.path.abspath(os.path.dirname(
        os.getcwd()) + os.path.sep + '../../../..')

    # buildMain.structureProject(cocosProjectPath)
    # buildMain.loginFirIm()
    buildMain.updateVersion(
        sys.argv[1], sys.argv[4], sys.argv[2], sys.argv[3])
#    buildMain.buildXcodeProject(sys.argv[1], cocosProjectPath)
#    buildMain.buildAndroidProject(sys.argv[1], cocosProjectPath)
