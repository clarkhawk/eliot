package expo.modules.ilotnetwork

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import org.java_websocket.server.WebSocketServer
import org.java_websocket.WebSocket
import org.java_websocket.handshake.ClientHandshake
import java.net.InetSocketAddress
import org.json.JSONObject

class IlotForegroundService : Service() {
  private var server: WebSocketServer? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val port = intent?.getIntExtra("port", 8765) ?: 8765
    val roomName = intent?.getStringExtra("roomName") ?: "Salon Îlot"
    val roomCode = intent?.getStringExtra("roomCode") ?: "ILOT-0000"
    val expiresAt = intent?.getDoubleExtra("expiresAt", 0.0) ?: 0.0
    createChannel()
    startForeground(42, notification())
    server = object : WebSocketServer(InetSocketAddress(port)) {
      private val messages = mutableListOf<String>()

      override fun onOpen(conn: WebSocket, handshake: ClientHandshake) {
        conn.send(JSONObject().apply {
          put("type", "ready")
          put("room", JSONObject().apply {
            put("code", roomCode)
            put("name", roomName)
            put("createdAt", System.currentTimeMillis())
            put("expiresAt", expiresAt)
            put("host", true)
          })
        }.toString())
      }

      override fun onClose(conn: WebSocket, code: Int, reason: String, remote: Boolean) = Unit

      override fun onMessage(conn: WebSocket, message: String) {
        val packet = JSONObject(message)
        when (packet.optString("type")) {
          "hello" -> {
            val history = JSONObject().apply {
              put("type", "history")
              put("messages", messages.map { JSONObject(it) })
            }
            conn.send(history.toString())
          }
          "message" -> {
            val incoming = packet.getJSONObject("message")
            incoming.put("roomCode", roomCode)
            val outgoing = JSONObject().apply {
              put("type", "message")
              put("message", incoming)
            }.toString()
            messages.add(incoming.toString())
            broadcast(outgoing)
          }
        }
      }

      override fun onError(conn: WebSocket?, ex: Exception) = Unit

      override fun onStart() = Unit
    }
    server?.start()
    return START_STICKY
  }

  override fun onDestroy() {
    server?.stop()
    super.onDestroy()
  }

  override fun onBind(intent: Intent?): IBinder? = null

  private fun createChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      getSystemService(NotificationManager::class.java).createNotificationChannel(NotificationChannel(CHANNEL, "Salon Îlot", NotificationManager.IMPORTANCE_LOW))
    }
  }

  private fun notification(): Notification = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
    Notification.Builder(this, CHANNEL).setContentTitle("Salon Îlot actif").setContentText("Le réseau local reste disponible").setSmallIcon(android.R.drawable.stat_sys_wifi).build()
  } else {
    Notification.Builder(this).setContentTitle("Salon Îlot actif").setContentText("Le réseau local reste disponible").setSmallIcon(android.R.drawable.stat_sys_wifi).build()
  }

  companion object {
    private const val CHANNEL = "ilot-network"
    fun start(context: Context, port: Int, roomName: String, roomCode: String, expiresAt: Double) {
      val intent = Intent(context, IlotForegroundService::class.java)
        .putExtra("port", port)
        .putExtra("roomName", roomName)
        .putExtra("roomCode", roomCode)
        .putExtra("expiresAt", expiresAt)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) context.startForegroundService(intent) else context.startService(intent)
    }
  }
}
