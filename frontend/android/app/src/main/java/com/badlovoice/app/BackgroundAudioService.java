package com.badlovoice.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;


/**
 * Foreground service (type: microphone) that keeps the voice changer alive while
 * the app is in the background, e.g. during Telegram / WhatsApp calls or voice notes.
 *
 * It only holds the process and shows a persistent notification. The audio itself
 * still runs in the WebView pipeline (see MainActivity.onPause).
 */
public class BackgroundAudioService extends Service {

    static final String CHANNEL_ID = "badlovoice_audio";
    static final int NOTIFICATION_ID = 4711;

    /** True while the service is running (read by MainActivity). */
    static volatile boolean running = false;

    public static void start(Context context) {
        Intent intent = new Intent(context, BackgroundAudioService.class);
        context.startForegroundService(intent);
    }

    public static void stop(Context context) {
        context.stopService(new Intent(context, BackgroundAudioService.class));
    }

    @Override
    public void onCreate() {
        super.onCreate();
        createChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Notification notification = buildNotification();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
        running = true;
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        running = false;
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager == null || manager.getNotificationChannel(CHANNEL_ID) != null) return;
        NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Voice changer",
                NotificationManager.IMPORTANCE_LOW);
        channel.setDescription("Shown while the voice changer is running in the background");
        manager.createNotificationChannel(channel);
    }

    private Notification buildNotification() {
        Intent launch = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent contentIntent = null;
        if (launch != null) {
            launch.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            contentIntent = PendingIntent.getActivity(
                    this, 0, launch, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        }
        Notification.Builder builder;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            builder = new Notification.Builder(this, CHANNEL_ID);
        } else {
            // minSdk 24: pre-channel devices. Deprecated constructor is the only option there.
            builder = new Notification.Builder(this);
        }
        builder.setContentTitle(getString(R.string.app_name))
                .setContentText("Voice changer is running")
                .setSmallIcon(android.R.drawable.ic_btn_speak_now)
                .setOngoing(true)
                .setContentIntent(contentIntent);
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            builder.setPriority(Notification.PRIORITY_LOW);
        }
        return builder.build();
    }
}
