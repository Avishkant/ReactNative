package com.flashlightcolors

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.soloader.SoLoader
import java.io.IOException

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    // Initialize native libraries without loading the New Architecture entry point.
    // We avoid calling DefaultNewArchitectureEntryPoint.load() here so the Fabric
    // renderer / new architecture initialization won't run at app startup.
    try {
      SoLoader.init(this, /* nativeExopackage */ false)
    } catch (error: IOException) {
      throw RuntimeException(error)
    }
  }
}
