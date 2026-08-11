// Place this file at:
// client/android/app/src/main/java/com/couple/taskmanager/ShareReceiverPlugin.java

package com.couple.taskmanager;

import android.content.Intent;
import android.net.Uri;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;

@CapacitorPlugin(name = "ShareReceiver")
public class ShareReceiverPlugin extends Plugin {

    // Holds a video path if the app was cold-launched via a share (before JS listeners attach)
    private String pendingVideoPath = null;

    @Override
    public void load() {
        // Handles the case where the app was NOT running and the share intent launched it fresh
        handleIntent(getActivity().getIntent());
    }

    // Called from MainActivity.onNewIntent() when the app is already running/backgrounded
    public void handleNewIntent(Intent intent) {
        handleIntent(intent);
    }

    private void handleIntent(Intent intent) {
        if (intent == null) return;

        String action = intent.getAction();
        String type = intent.getType();

        if (Intent.ACTION_SEND.equals(action) && type != null && type.startsWith("video/")) {
            Uri videoUri = intent.getParcelableExtra(Intent.EXTRA_STREAM);
            if (videoUri != null) {
                String localPath = copyUriToCache(videoUri);
                if (localPath != null) {
                    pendingVideoPath = localPath;

                    JSObject data = new JSObject();
                    data.put("path", localPath);
                    notifyListeners("sharedVideoReceived", data);
                }
            }
            // Clear the intent's action so re-triggering onCreate/resume doesn't reprocess the same share
            intent.setAction(null);
        }
    }

    // Copies the shared video from its content:// URI into the app's own cache dir,
    // so we have a stable local file path to hand off to JS / upload from.
    private String copyUriToCache(Uri uri) {
        try (InputStream in = getContext().getContentResolver().openInputStream(uri)) {
            if (in == null) return null;

            String fileName = "shared_video_" + System.currentTimeMillis() + ".mp4";
            File outFile = new File(getContext().getCacheDir(), fileName);

            try (FileOutputStream out = new FileOutputStream(outFile)) {
                byte[] buffer = new byte[8192];
                int len;
                while ((len = in.read(buffer)) != -1) {
                    out.write(buffer, 0, len);
                }
            }

            return outFile.getAbsolutePath();
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    // Lets JS pull a pending video on demand (e.g. right after app init) in case the
    // 'sharedVideoReceived' event fired before any listener was attached.
    @PluginMethod
    public void getPendingVideo(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("path", pendingVideoPath);
        call.resolve(ret);
        pendingVideoPath = null;
    }
}
