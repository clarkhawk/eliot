package expo.modules.ilotnetwork

import java.net.NetworkInterface

object NetworkUtils {
  /** Best-effort gateway address for the local-only hotspot interface. */
  fun hotspotHostAddress(): String {
    try {
      NetworkInterface.getNetworkInterfaces()?.toList()?.forEach { iface ->
        if (!iface.isUp || iface.isLoopback) return@forEach
        val name = iface.name.lowercase()
        if (!name.contains("wlan") && !name.contains("ap") && !name.contains("swlan")) return@forEach
        iface.inetAddresses.toList().forEach { addr ->
          val host = addr.hostAddress ?: return@forEach
          if (!addr.isLoopbackAddress && host.indexOf(':') < 0 && host.startsWith("192.168.")) {
            return host
          }
        }
      }
    } catch (_: Exception) {
      // Fall back to the common Android hotspot gateway.
    }
    return "192.168.43.1"
  }
}
