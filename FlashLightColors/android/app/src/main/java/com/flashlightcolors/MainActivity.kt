package com.flashlightcolors

import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "FlashLightColors"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate {
    // Disable the Fabric renderer and Concurrent Root by default here to
    // avoid crashes when native modules don't support the new architecture.
    // Wrap `onCreate` to catch `UnsatisfiedLinkError` thrown when RN attempts
    // to load optional native feature-flag libraries (e.g. libreact_featureflagsjni.so).
    return object : DefaultReactActivityDelegate(
      this,
      mainComponentName,
      /* fabricEnabled */ false,
      /* concurrentRootEnabled */ false,
    ) {
      override fun onCreate(savedInstanceState: Bundle?) {
        try {
          super.onCreate(savedInstanceState)
        } catch (e: UnsatisfiedLinkError) {
          // Missing native library (libreact_featureflagsjni.so) — avoid crash.
          // The app will run without bridgeless/new-arch features until libraries are available.
        }
      }
    }
  }
}
