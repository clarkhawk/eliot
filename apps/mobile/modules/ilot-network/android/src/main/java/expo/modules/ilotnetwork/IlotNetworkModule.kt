package expo.modules.ilotnetwork

import android.content.Context
import android.content.Intent
import android.net.wifi.WifiNetworkSuggestion
import android.net.wifi.WifiManager
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class IlotNetworkModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("IlotNetwork")

    AsyncFunction("startHost") { name: String, expiresAt: Double, promise: Promise ->
      val context = appContext.reactContext ?: run {
        promise.reject("NO_CONTEXT", "Android context unavailable", null)
        return@AsyncFunction
      }
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
        promise.reject("UNSUPPORTED", "LocalOnlyHotspot requires Android 8 or newer", null)
        return@AsyncFunction
      }
      val wifi = context.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
      wifi.startLocalOnlyHotspot(object : WifiManager.LocalOnlyHotspotCallback() {
        override fun onStarted(reservation: WifiManager.LocalOnlyHotspotReservation) {
          HotspotHolder.reservation = reservation
          @Suppress("DEPRECATION")
          val config = reservation.wifiConfiguration
          val alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
          val code = "ILOT-" + (1..6).map { alphabet.random() }.joinToString("")
          val port = 8765
          val createdAt = System.currentTimeMillis().toDouble()
          val hostIp = NetworkUtils.hotspotHostAddress()
          IlotForegroundService.start(context, port, name.take(40), code, createdAt, expiresAt)
          promise.resolve(Bundle().apply {
            putInt("v", 1)
            putString("salon", name.take(40))
            putString("code", code)
            putDouble("exp", expiresAt)
            putString("ssid", config.ssid?.trim()?.trim('"') ?: "")
            putString("password", config.passphrase)
            putString("url", "ws://$hostIp:$port")
          })
        }

        override fun onFailed(reason: Int) {
          promise.reject("HOTSPOT_FAILED", "Impossible de démarrer le hotspot local ($reason)", null)
        }
      }, null)
    }

    AsyncFunction("stopHost") { roomCode: String?, promise: Promise ->
      val context = appContext.reactContext ?: run {
        promise.reject("NO_CONTEXT", "Android context unavailable", null)
        return@AsyncFunction
      }
      HotspotHolder.stop(context)
      IlotForegroundService.stop(context, roomCode)
      promise.resolve(null)
    }

    AsyncFunction("joinNetwork") { ssid: String, password: String, promise: Promise ->
      val context = appContext.reactContext ?: run {
        promise.reject("NO_CONTEXT", "Android context unavailable", null)
        return@AsyncFunction
      }
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
        promise.reject("UNSUPPORTED", "WifiNetworkSuggestion requires Android 10 or newer", null)
        return@AsyncFunction
      }
      val wifi = context.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
      val suggestion = WifiNetworkSuggestion.Builder().setSsid(ssid).setWpa2Passphrase(password).build()
      val result = wifi.addNetworkSuggestions(listOf(suggestion))
      if (result == WifiManager.STATUS_NETWORK_SUGGESTIONS_SUCCESS) promise.resolve(null)
      else promise.reject("WIFI_FAILED", "Android a refusé la suggestion Wi-Fi ($result)", null)
    }

    AsyncFunction("openWifiSettings") { promise: Promise ->
      val context = appContext.reactContext ?: run {
        promise.reject("NO_CONTEXT", "Android context unavailable", null)
        return@AsyncFunction
      }
      val intent = Intent(Settings.ACTION_WIFI_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
      promise.resolve(null)
    }
  }
}
