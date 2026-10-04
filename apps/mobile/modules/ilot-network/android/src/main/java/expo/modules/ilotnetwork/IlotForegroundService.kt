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
import java.util.UUID
import org.json.JSONObject

class IlotForegroundService : Service() {
  private var server: WebSocketServer? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val port = intent?.getIntExtra("port", 8765) ?: 8765
    val roomName = intent?.getStringExtra("roomName") ?: "Salon Îlot"
    val roomCode = intent?.getStringExtra("roomCode") ?: "ILOT-0000"
    val expiresAt = intent?.getDoubleExtra("expiresAt", 0.0) ?: 0.0
    val createdAt = intent?.getDoubleExtra("createdAt", System.currentTimeMillis().toDouble()) ?: System.currentTimeMillis().toDouble()
    createChannel()
    startForeground(42, notification())
    val expiresAtMs = expiresAt.toLong()
    val store = RoomMessageStore(this, roomCode)
    server = object : WebSocketServer(InetSocketAddress(port)) {
      private val messages = store.load()
      private val sessions = mutableMapOf<WebSocket, Session>()
      private val failedAttempts = mutableMapOf<String, Int>()

      init {
        android.os.Handler(mainLooper).postDelayed({
          if (System.currentTimeMillis() >= expiresAtMs) {
            connections.forEach { it.close(1000, "Salon expiré") }
            stopSelf()
          }
        }, maxOf(0L, expiresAtMs - System.currentTimeMillis()))
      }

      override fun onOpen(conn: WebSocket, handshake: ClientHandshake) {
        if (failedAttempts[remoteKey(conn)] == null) failedAttempts[remoteKey(conn)] = 0
      }

      override fun onClose(conn: WebSocket, code: Int, reason: String, remote: Boolean) {
        sessions.remove(conn)
      }

      override fun onMessage(conn: WebSocket, message: String) {
        if (System.currentTimeMillis() >= expiresAtMs) {
          conn.send(error("Salon expiré"))
          conn.close(1000, "Salon expiré")
          return
        }
        try {
          val packet = JSONObject(message)
          when (packet.optString("type")) {
            "hello" -> {
              val requestedCode = packet.optJSONObject("room")?.optString("code", "")?.uppercase()
              if (requestedCode != roomCode.uppercase()) {
                val key = remoteKey(conn)
                val attempts = (failedAttempts[key] ?: 0) + 1
                failedAttempts[key] = attempts
                conn.send(error("Code de salon invalide"))
                if (attempts >= MAX_ATTEMPTS) conn.close(1008, "Trop d'essais")
                return
              }
              val pseudo = packet.optString("pseudo", "Invité").trim().take(40).ifEmpty { "Invité" }
              val session = Session(UUID.randomUUID().toString(), pseudo)
              sessions[conn] = session
              conn.send(JSONObject().apply {
                put("type", "ready")
                put("room", room(roomCode, roomName, createdAt, expiresAt))
                put("sessionId", session.token)
              }.toString())
              conn.send(JSONObject().apply {
                put("type", "history")
                put("messages", messages.map { JSONObject(it) })
              }.toString())
            }
            "message" -> {
              val session = sessions[conn] ?: run {
                conn.send(error("Session non authentifiée"))
                return
              }
              val incoming = packet.getJSONObject("message")
              val messageId = incoming.optString("id", "").trim()
              incoming.put("id", if (messageId.isNotEmpty()) messageId else UUID.randomUUID().toString())
              incoming.put("roomCode", roomCode)
              incoming.put("authorId", session.token)
              incoming.put("author", session.pseudo)
              incoming.put("ts", System.currentTimeMillis())
              val outgoing = JSONObject().apply {
                put("type", "message")
                put("message", incoming)
              }.toString()
              messages.add(incoming.toString())
              store.append(incoming.toString())
              broadcast(outgoing)
            }
          }
        } catch (_: Exception) {
          conn.send(error("Paquet réseau invalide"))
        }
      }

      override fun onError(conn: WebSocket?, ex: Exception) = Unit

      override fun onStart() = Unit

      private fun remoteKey(conn: WebSocket): String = conn.remoteSocketAddress?.address?.hostAddress ?: "unknown"

      private fun error(message: String) = JSONObject().apply {
        put("type", "error")
        put("message", message)
      }.toString()

      private fun room(code: String, name: String, createdAt: Double, expiresAt: Double) = JSONObject().apply {
        put("code", code)
        put("name", name)
        put("createdAt", createdAt)
        put("expiresAt", expiresAt)
        put("host", true)
      }
    }
    server?.start()
    return START_STICKY
  }

  override fun onDestroy() {
    server?.stop()
    server = null
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
    private const val MAX_ATTEMPTS = 5
    private data class Session(val token: String, val pseudo: String)

    fun start(context: Context, port: Int, roomName: String, roomCode: String, createdAt: Double, expiresAt: Double) {
      val intent = Intent(context, IlotForegroundService::class.java)
        .putExtra("port", port)
        .putExtra("roomName", roomName)
        .putExtra("roomCode", roomCode)
        .putExtra("createdAt", createdAt)
        .putExtra("expiresAt", expiresAt)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) context.startForegroundService(intent) else context.startService(intent)
    }

    fun stop(context: Context, roomCode: String? = null) {
      if (roomCode != null) RoomMessageStore(context, roomCode).clear()
      context.stopService(Intent(context, IlotForegroundService::class.java))
    }
  }
}
