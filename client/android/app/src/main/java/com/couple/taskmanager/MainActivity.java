package com.couple.taskmanager;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.webkit.WebSettings;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.PluginHandle;
import com.google.firebase.BuildConfig;

public class MainActivity extends BridgeActivity {

  @Override
  public void onCreate(Bundle savedInstanceState) {
    // Must be registered BEFORE super.onCreate()
    registerPlugin(ShareReceiverPlugin.class);
    super.onCreate(savedInstanceState);
    applyMixedContentFixIfDebug("onCreate");
  }

  @Override
  public void onResume() {
    super.onResume();
    // Re-applied here in case Capacitor's own Bridge setup resets WebView settings
    // sometime after onCreate() but before the page actually makes its first request.
    applyMixedContentFixIfDebug("onResume");
  }

  private void applyMixedContentFixIfDebug(String from) {
    boolean isDebug = BuildConfig.DEBUG;
    WebSettings settings = (getBridge() != null && getBridge().getWebView() != null)
      ? getBridge().getWebView().getSettings()
      : null;

    Log.d("MixedContentFix", "[" + from + "] BuildConfig.DEBUG=" + isDebug + ", webViewSettings=" + settings);

    if (isDebug && settings != null) {
      settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
      Log.d("MixedContentFix", "[" + from + "] MixedContentMode set to ALWAYS_ALLOW");
    }
  }

  @Override
  public void onNewIntent(Intent intent) {
    super.onNewIntent(intent);
    setIntent(intent);

    PluginHandle handle = getBridge().getPlugin("ShareReceiver");
    if (handle != null) {
      ShareReceiverPlugin plugin = (ShareReceiverPlugin) handle.getInstance();
      if (plugin != null) {
        plugin.handleNewIntent(intent);
      }
    }
  }
}
