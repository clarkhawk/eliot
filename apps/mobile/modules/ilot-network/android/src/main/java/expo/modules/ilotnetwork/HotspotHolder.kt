package expo.modules.ilotnetwork

import android.content.Context
import android.content.Intent
import android.net.wifi.WifiManager

object HotspotHolder {
  @Volatile
  var reservation: WifiManager.LocalOnlyHotspotReservation? = null

  fun stop(context: Context) {
    try {
      reservation?.close()
    } catch (_: Exception) {
      // Reservation may already be closed.
    }
    reservation = null
    context.stopService(Intent(context, IlotForegroundService::class.java))
  }
}
