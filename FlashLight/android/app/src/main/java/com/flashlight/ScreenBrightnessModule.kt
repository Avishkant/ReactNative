package com.flashlight

import android.provider.Settings
import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class ScreenBrightnessModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String {
    return "ScreenBrightness"
  }

  @ReactMethod
  fun getSystemBrightness(promise: Promise) {
    try {
      val cr = reactApplicationContext.contentResolver
      val valInt = Settings.System.getInt(cr, Settings.System.SCREEN_BRIGHTNESS)
      promise.resolve(valInt)
    } catch (e: Exception) {
      promise.reject("ERROR", e.message)
    }
  }

  @ReactMethod
  fun setWindowBrightness(value: Double, promise: Promise) {
    try {
      val activity = getCurrentActivity()
      if (activity == null) {
        Log.e("ScreenBrightness", "setWindowBrightness: current activity is null")
        promise.resolve(false)
        return
      }

      // Ensure we modify window attributes on the Android UI thread.
      try {
        activity.runOnUiThread {
          try {
            Log.d("ScreenBrightness", "setWindowBrightness: running on UI thread, value=$value")
            val lp = activity.window.attributes
            // Android expects -1 for system default, or 0..1 for explicit brightness
            lp.screenBrightness = value.toFloat()
            activity.window.attributes = lp
            Log.d("ScreenBrightness", "setWindowBrightness: success on UI thread, value=$value")
            promise.resolve(true)
          } catch (inner: Exception) {
            Log.e("ScreenBrightness", "setWindowBrightness: failed to set window attributes on UI thread", inner)
            try {
              promise.resolve(false)
            } catch (_: Exception) {}
          }
        }
      } catch (uiEx: Exception) {
        Log.e("ScreenBrightness", "setWindowBrightness: failed to post to UI thread", uiEx)
        promise.resolve(false)
        return
      }
    } catch (e: Exception) {
      Log.e("ScreenBrightness", "setWindowBrightness: unexpected error", e)
      try {
        promise.resolve(false)
      } catch (_: Exception) {}
    }
  }
}
