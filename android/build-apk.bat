@echo off
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "ANDROID_HOME=C:\Users\apriy\AppData\Local\Android\sdk"
set "PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%PATH%"
echo JAVA_HOME = %JAVA_HOME%
java -version
echo Building APK...
call gradlew.bat assembleDebug
echo Done.
