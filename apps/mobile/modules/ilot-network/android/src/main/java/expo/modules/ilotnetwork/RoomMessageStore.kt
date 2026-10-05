package expo.modules.ilotnetwork

import android.content.Context
import java.io.File

class RoomMessageStore(context: Context, roomCode: String) {
  private val file = File(context.filesDir, "ilot-room-${roomCode.uppercase()}.jsonl")

  fun load(): MutableList<String> {
    if (!file.exists()) return mutableListOf()
    return file.readLines().filter { it.isNotBlank() }.toMutableList()
  }

  fun append(line: String) {
    file.appendText(line + "\n")
  }

  fun clear() {
    if (file.exists()) file.delete()
  }
}
