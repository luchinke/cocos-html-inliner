(function () {
    function boot () {
        var settings = window._CCSettings;
        window._CCSettings = undefined;

        if (!settings.debug) {
            var uuids = settings.uuids;
            var rawAssets = settings.rawAssets;
            var assetTypes = settings.assetTypes;
            var realRawAssets = settings.rawAssets = {};
            for (var mount in rawAssets) {
                var entries = rawAssets[mount];
                var realEntries = realRawAssets[mount] = {};
                for (var id in entries) {
                    var entry = entries[id];
                    var type = entry[1];
                    if (typeof type === 'number') {
                        entry[1] = assetTypes[type];
                    }
                    realEntries[uuids[id] || id] = entry;
                }
            }

            var scenes = settings.scenes;
            for (var i = 0; i < scenes.length; ++i) {
                var scene = scenes[i];
                if (typeof scene.uuid === 'number') {
                    scene.uuid = uuids[scene.uuid];
                }
            }

            var packedAssets = settings.packedAssets;
            for (var packId in packedAssets) {
                var packedIds = packedAssets[packId];
                for (var j = 0; j < packedIds.length; ++j) {
                    if (typeof packedIds[j] === 'number') {
                        packedIds[j] = uuids[packedIds[j]];
                    }
                }
            }

            var subpackages = settings.subpackages;
            for (var subId in subpackages) {
                var uuidArray = subpackages[subId].uuids;
                if (uuidArray) {
                    for (var k = 0, l = uuidArray.length; k < l; k++) {
                        if (typeof uuidArray[k] === 'number') {
                            uuidArray[k] = uuids[uuidArray[k]];
                        }
                    }
                }
            }
        }

        // function setLoadingDisplay () {
        //     // Loading splash scene
        //     var splash = document.getElementById('splash');
        //     var progressBar = splash.querySelector('.progress-bar span');
        //     cc.loader.onProgress = function (completedCount, totalCount, item) {
        //         var percent = 100 * completedCount / totalCount;
        //         if (progressBar) {
        //             progressBar.style.width = percent.toFixed(2) + '%';
        //         }
        //     };
        //     splash.style.display = 'block';
        //     progressBar.style.width = '0%';

        //     cc.director.once(cc.Director.EVENT_AFTER_SCENE_LAUNCH, function () {
        //         splash.style.display = 'none';
        //     });
        // }

        var onStart = function () {
            cc.loader.downloader._subpackages = settings.subpackages;
            cc.view.enableRetina(true);
            cc.view.resizeWithBrowserSize(true);

            if (cc.sys.isMobile) {
                if (settings.orientation === 'landscape') {
                    cc.view.setOrientation(cc.macro.ORIENTATION_LANDSCAPE);
                }
                else if (settings.orientation === 'portrait') {
                    cc.view.setOrientation(cc.macro.ORIENTATION_PORTRAIT);
                }
                // cc.view.enableAutoFullScreen([
                //     cc.sys.BROWSER_TYPE_BAIDU,
                //     cc.sys.BROWSER_TYPE_WECHAT,
                //     cc.sys.BROWSER_TYPE_MOBILE_QQ,
                //     cc.sys.BROWSER_TYPE_MIUI,
                // ].indexOf(cc.sys.browserType) < 0);
            }

            // Limit downloading max concurrent task to 2,
            // more tasks simultaneously may cause performance draw back on some android system / brwosers.
            // You can adjust the number based on your own test result, you have to set it before any loading process to take effect.
            if (cc.sys.isBrowser && cc.sys.os === cc.sys.OS_ANDROID) {
                cc.macro.DOWNLOAD_MAX_CONCURRENT = 2;
            }

            function loadScene(launchScene) {
                cc.director.loadScene(launchScene,
                    function (err) {
                        if (!err) {
                            if (cc.sys.isBrowser) {
                                // show canvas
                                var canvas = document.getElementById('GameCanvas');
                                canvas.style.visibility = '';
                            }
                            cc.loader.onProgress = null;
                        }
                        else if (CC_BUILD) {
                            setTimeout(function () {
                                loadScene(launchScene);
                            }, 1000);
                        }
                    }
                );
            }
    
            var launchScene = settings.launchScene;
            loadScene(launchScene);
        };

        var jsList = settings.jsList;
        var debugMode;
        if (cc.ENGINE_VERSION.startsWith('1.9')) {
            debugMode = cc.DebugMode.ERROR
        } else {
            debugMode = cc.debug.DebugMode.ERROR
        }
        var option = {
            id: 'GameCanvas',
            scenes: settings.scenes,
            debugMode: debugMode,
            showFPS: false,
            frameRate: 60,
            jsList: jsList,
            groupList: settings.groupList,
            collisionMatrix: settings.collisionMatrix,
        }

        cc.AssetLibrary.init({
            libraryPath: 'res/import',
            rawAssetsBase: 'res/raw-',
            rawAssets: settings.rawAssets,
            packedAssets: settings.packedAssets,
            md5AssetsMap: settings.md5AssetsMap
        });

        cc.game.run(option, onStart);
    }

    if (window.document) {
        var __audioSupport = cc.sys.__audioSupport;
        var formatSupport = __audioSupport.format;
        var context = __audioSupport.context;

        function base64toBlob(base64, type) {  
            var bstr = atob(base64, type),  
            n = bstr.length,  
            u8arr = new Uint8Array(n);  
            while (n--) {  
                u8arr[n] = bstr.charCodeAt(n);
            }  
            return new Blob([u8arr], {  
                type: type,
            })
        }

        function base64toArray(base64) {  
            var bstr = atob(base64),  
            n = bstr.length,  
            u8arr = new Uint8Array(n);  
            while (n--) {  
                u8arr[n] = bstr.charCodeAt(n);
            }
            return u8arr;
        }

        function loadDomAudio(item, callback) {
            var dom = document.createElement('audio');

            dom.muted = true;
            dom.muted = false;

            var data = window.resMap[item.url.split("?")[0]];
            data = base64toBlob(data, "audio/mpeg");

            if (window.URL) {
                dom.src = window.URL.createObjectURL(data);
            } else {
                dom.src = data;
            }
            
            var clearEvent = function () {
                clearTimeout(timer);
                dom.removeEventListener("canplaythrough", success, false);
                dom.removeEventListener("error", failure, false);
                if(__audioSupport.USE_LOADER_EVENT)
                    dom.removeEventListener(__audioSupport.USE_LOADER_EVENT, success, false);
            };
            var timer = setTimeout(function () {
                if (dom.readyState === 0)
                    failure();
                else
                    success();
            }, 8000);
            var success = function () {
                clearEvent();
                item.element = dom;
                callback(null, item.url);
            };
            var failure = function () {
                clearEvent();
                var message = 'load audio failure - ' + item.url;
                cc.log(message);
                callback(message, item.url);
            };
            dom.addEventListener("canplaythrough", success, false);
            dom.addEventListener("error", failure, false);
            if(__audioSupport.USE_LOADER_EVENT)
                dom.addEventListener(__audioSupport.USE_LOADER_EVENT, success, false);
        }

        function loadWebAudio(item, callback) {
            if (!context) callback(new Error('Audio Downloader: no web audio context.'));

            var data = window.resMap[item.url];
            data = base64toArray(data);

            if (data) {
                context["decodeAudioData"](data.buffer, function(buffer){
                    //success
                    item.buffer = buffer;
                    callback(null, item.id);
                }, function(){
                    //error
                    callback('decode error - ' + item.id, null);
                });
            } else {
                callback('request error - ' + item.id, null);
            }
        }

        var arrayBufferHandler = (item, callback, isCrossOrigin, img) => {
            var index = item.url.lastIndexOf(".");
            var strtype=item.url.substr(index + 1, 4); 
            strtype=strtype.toLowerCase(); 
            var data = window.resMap[item.url];

            var img = new Image();
            function loadCallback () {
                img.removeEventListener('load', loadCallback);
                img.removeEventListener('error', errorCallback);
                callback(null, img);
            }
            function errorCallback () {
                img.removeEventListener('load', loadCallback);
                img.removeEventListener('error', errorCallback);
                callback(new Error('Load image (' + url + ') failed'));
            }
    
            img.addEventListener('load', loadCallback);
            img.addEventListener('error', errorCallback);
            img.src = data;
        };

        var jsonBufferHandler = (item, callback) => {
            var str = window.resMap[item.url];
            callback(null, str);
        };

        var audioBufferHandler = (item, callback) => {
            if (formatSupport.length === 0) {
                return new Error('Audio Downloader: audio not supported on this browser!');
            }
        
            item.content = item.url;
        
            // If WebAudio is not supported, load using DOM mode
            if (!__audioSupport.WEB_AUDIO || (item.urlParam && item.urlParam['useDom'])) {
                loadDomAudio(item, callback);
            }
            else {
                loadWebAudio(item, callback);
            }
        }

        cc.loader.addDownloadHandlers({
            png: arrayBufferHandler,
            jpg: arrayBufferHandler,
            jpeg: arrayBufferHandler,
            json: jsonBufferHandler, 
            plist: jsonBufferHandler,
            mp3: audioBufferHandler,
            ogg: audioBufferHandler,
            wav: audioBufferHandler,
            m4a: audioBufferHandler
        });

        // var splash = document.getElementById('splash');
        // splash.style.display = 'block';
        boot();
    }
})();
