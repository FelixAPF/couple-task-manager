package com.couple.taskmanager;

import android.content.Intent;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.PluginHandle;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Must be registered BEFORE super.onCreate()
        registerPlugin(ShareReceiverPlugin.class);
        super.onCreate(savedInstanceState);
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
