import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Pressable, StyleSheet, useWindowDimensions, View} from 'react-native';

import {
  LANDSCAPE,
  OrientationLocker,
  PORTRAIT,
} from 'react-native-orientation-locker';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import WebView from 'react-native-webview';

import FullScreen from './FullScreen.svg';

const Video = ({intialHeight, videoId}) => {
  const insets = useSafeAreaInsets();
  const {height: windowHeight, width: windowWidth} = useWindowDimensions();

  const [ended, setEnded] = useState(false);

  const [iframeDimensions, setIframeDimensions] = useState({
    height: intialHeight,
    width: windowWidth,
  });

  const [isFullScreen, setIsFullScreen] = useState(false);

  const onMessage = useCallback(event => {
    let data;

    try {
      data = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }

    if (data?.videoEvent === 'ended') {
      setEnded(true);
    } else if (data?.videoEvent === 'loaded' && (data.height || data.width)) {
      setIframeDimensions({height: data.height, width: data.width});
    }
  }, []);

  const toggleFullScreen = useCallback(
    () => setIsFullScreen(prevIsFullScreen => !prevIsFullScreen),
    [],
  );

  const videoHeight = isFullScreen
    ? windowHeight - insets.top - insets.bottom
    : iframeDimensions.height;

  const videoWidth = isFullScreen
    ? (videoHeight * iframeDimensions.width) / iframeDimensions.height
    : windowWidth - insets.left - insets.right;

  console.log('ended', ended);

  const html = useRef(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Vimeo Demo</title>
      <style>
        * {
          margin: 0;
          padding: 0;
        }
      </style>
    </head>
    <body>
      <div id="MyVimeo"></div>
      <script src="https://player.vimeo.com/api/player.js"></script>
      <script>
        const sendToRN = message =>
          window.ReactNativeWebView &&
          window.ReactNativeWebView.postMessage &&
          window.ReactNativeWebView.postMessage(JSON.stringify(message));

        const getVideoPlayerDiv = () => document.getElementById('MyVimeo')

        const getVideoPlayerElement = () => getVideoPlayerDiv().firstChild

        const getVideoPlayerHeight = () => getVideoPlayerElement().offsetHeight

        const getVideoPlayerWidth = () => getVideoPlayerElement().offsetWidth

        const videoPlayer = new Vimeo.Player('MyVimeo', {
          id: '${videoId}',
          width: ${windowWidth},
        });

        videoPlayer.on('ended', () => sendToRN({videoEvent: 'ended'}));

        videoPlayer.on('loaded', () =>
          sendToRN({
            height: getVideoPlayerHeight(),
            videoEvent: 'loaded',
            width: getVideoPlayerWidth(),
          }),
        );
      </script>
    </body>
    </html>
  `);

  const webViewRef = useRef(null);

  useEffect(() => {
    if (isFullScreen) {
      webViewRef.current?.injectJavaScript?.(`
          videoPlayerDiv = document.getElementById('MyVimeo');
          videoPlayerElement = videoPlayerDiv.firstChild;

          scaleX = ${videoWidth} / videoPlayerElement.offsetWidth;
          scaleY = ${videoHeight} / videoPlayerElement.offsetHeight;
          translateX = (${videoWidth} - videoPlayerElement.offsetWidth) / 2;
          translateY = (${videoHeight} - videoPlayerElement.offsetHeight) / 3;

          transform = [
            \`scaleX(\${scaleX})\`,
            \`scaleY(\${scaleY})\`,
            \`translateX(\${translateX}px)\`,
            \`translateY(\${translateY}px)\`,
          ].join(' ');

          videoPlayerDiv.style = \`transform: \${transform}\`;

          true;
      `);
    } else {
      webViewRef.current?.injectJavaScript?.(`
        videoPlayerDiv = document.getElementById('MyVimeo');
        if (videoPlayerDiv) {
          videoPlayerDiv.style = '';
        }
        true;
      `);
    }
  }, [isFullScreen, videoHeight, videoWidth]);

  return (
    <>
      <OrientationLocker orientation={isFullScreen ? LANDSCAPE : PORTRAIT} />
      <View style={styles.container}>
        <View style={{height: videoHeight, width: videoWidth}}>
          <WebView
            allowsFullscreenVideo
            allowsInlineMediaPlayback
            javaScriptEnabled
            onMessage={onMessage}
            ref={webViewRef}
            scalesPageToFit={false}
            scrollEnabled={false}
            source={{html: html.current}}
            style={{height: videoHeight, width: videoWidth}}
          />
          <Pressable
            onPress={toggleFullScreen}
            style={({pressed}) => [
              styles.fullscreen,
              pressed && styles.fullscreenPressed,
            ]}>
            <FullScreen height={12} width={12} />
          </Pressable>
        </View>
      </View>
    </>
  );
};

const App = () => {
  const intialHeight = 200;
  const videoId = '721284295';

  return (
    <SafeAreaProvider>
      <Video intialHeight={intialHeight} videoId={videoId} />
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: 'white',
    flex: 1,
    justifyContent: 'center',
    width: '100%',
  },
  fullscreen: {
    alignSelf: 'flex-start',
    backgroundColor: '#000000CC',
    borderRadius: 5,
    bottom: 10,
    padding: 5,
    position: 'absolute',
    right: 10,
  },
  fullscreenPressed: {
    backgroundColor: '#008ABF',
  },
});

export default App;
