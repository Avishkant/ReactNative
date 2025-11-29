package com.flashlight

import android.content.Context
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.os.Build
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class TorchBrightnessModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String {
    return "TorchBrightness"
  }

  private fun findCameraWithFlash(context: Context): String? {
    val camManager = context.getSystemService(Context.CAMERA_SERVICE) as CameraManager
    try {
      for (id in camManager.cameraIdList) {
        val characteristics = camManager.getCameraCharacteristics(id)
        val hasFlash = characteristics.get(CameraCharacteristics.FLASH_INFO_AVAILABLE)
        if (hasFlash == true) {
          return id
        }
      }
    } catch (e: Exception) {
      return null
    }
    return null
  }

  @ReactMethod
  fun setTorchBrightness(level: Int, promise: Promise) {
    try {
      // Use numeric SDK check to avoid compile-time dependency on newer SDK constants
      if (Build.VERSION.SDK_INT < 33) {
        promise.reject("UNSUPPORTED", "Brightness control requires Android 13+")
        return
      }

      val camId = findCameraWithFlash(reactApplicationContext)
      if (camId == null) {
        promise.reject("NO_CAMERA", "No camera with flash available")
        return
      }

      val camManager = reactApplicationContext.getSystemService(Context.CAMERA_SERVICE) as CameraManager

      // Map 0..100 -> 1..255
      val mapped = ((level.coerceIn(0,100) / 100.0) * 255.0).toInt().coerceIn(1,255)

      // Call setTorchStrengthLevel via reflection so this module can compile against older SDKs
      try {
        val method = CameraManager::class.java.getMethod("setTorchStrengthLevel", String::class.java, Int::class.javaPrimitiveType)
        method.invoke(camManager, camId, mapped)
        promise.resolve(true)
        return
      } catch (e: NoSuchMethodException) {
        // method not available on this platform
        promise.reject("UNSUPPORTED", "Device does not support torch brightness adjustment")
        return
      }
    } catch (e: Exception) {
      promise.reject("ERROR", e.message)
    }
  }
}
