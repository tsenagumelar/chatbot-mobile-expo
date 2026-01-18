package com.policeassistant.app.speech

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule

class SpeechRecognizerModule(
  private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext), RecognitionListener, LifecycleEventListener {

  private val logTag = "SpeechRecognizer"
  private var speechRecognizer: SpeechRecognizer? = null
  private var isListening = false
  private var shouldRestart = false
  private var useInterimResults = true
  private var language: String? = null
  private val mainHandler = Handler(Looper.getMainLooper())

  init {
    reactContext.addLifecycleEventListener(this)
  }

  override fun getName(): String = "SpeechRecognizerModule"

  @ReactMethod
  fun isAvailable(promise: Promise) {
    promise.resolve(SpeechRecognizer.isRecognitionAvailable(reactContext))
  }

  @ReactMethod
  fun addListener(eventName: String) = Unit

  @ReactMethod
  fun removeListeners(count: Int) = Unit

  @ReactMethod
  fun startListening(lang: String?, interimResults: Boolean, continuous: Boolean, promise: Promise) {
    if (!SpeechRecognizer.isRecognitionAvailable(reactContext)) {
      promise.reject("unavailable", "Speech recognition not available")
      return
    }

    language = lang
    useInterimResults = interimResults
    shouldRestart = continuous

    mainHandler.post {
      // Destroy and recreate recognizer for clean state
      try {
        speechRecognizer?.destroy()
      } catch (e: Exception) {
        Log.w(logTag, "Error destroying previous recognizer: ${e.message}")
      }
      
      speechRecognizer = SpeechRecognizer.createSpeechRecognizer(reactContext)
      speechRecognizer?.setRecognitionListener(this)

      try {
        Log.d(
          logTag,
          "startListening lang=$language interim=$useInterimResults continuous=$shouldRestart"
        )
        startRecognizer()
        isListening = true
        promise.resolve(null)
      } catch (e: Exception) {
        Log.e(logTag, "startListening failed", e)
        promise.reject("start_failed", e.message, e)
      }
    }
  }

  @ReactMethod
  fun stopListening(promise: Promise) {
    shouldRestart = false
    isListening = false
    Log.d(logTag, "stopListening - shouldRestart=$shouldRestart")
    mainHandler.post {
      try {
        speechRecognizer?.stopListening()
        promise.resolve(null)
      } catch (e: Exception) {
        Log.w(logTag, "stopListening error: ${e.message}")
        promise.resolve(null) // Resolve anyway
      }
    }
  }

  @ReactMethod
  fun cancelListening(promise: Promise) {
    shouldRestart = false
    isListening = false
    Log.d(logTag, "cancelListening")
    mainHandler.post {
      speechRecognizer?.cancel()
      promise.resolve(null)
    }
  }

  private fun startRecognizer() {
    val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
      putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
      if (!language.isNullOrBlank()) {
        putExtra(RecognizerIntent.EXTRA_LANGUAGE, language)
        putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, language)
      }
      putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, useInterimResults)
      putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
    }
    mainHandler.post {
      speechRecognizer?.startListening(intent)
    }
  }

  private fun emitEvent(name: String, data: WritableMap?) {
    reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(name, data)
  }

  private fun emitState(state: String) {
    val payload = Arguments.createMap().apply {
      putString("state", state)
    }
    emitEvent("SpeechRecognizerState", payload)
  }

  private fun emitResult(text: String, isFinal: Boolean) {
    val payload = Arguments.createMap().apply {
      putString("text", text)
      putBoolean("isFinal", isFinal)
    }
    emitEvent("SpeechRecognizerResult", payload)
  }

  private fun emitError(code: Int) {
    val payload = Arguments.createMap().apply {
      putInt("code", code)
      putString("message", errorMessage(code))
    }
    emitEvent("SpeechRecognizerError", payload)
  }

  private fun errorMessage(code: Int): String = when (code) {
    SpeechRecognizer.ERROR_AUDIO -> "Audio error"
    SpeechRecognizer.ERROR_CLIENT -> "Client error. Coba ulang dalam beberapa detik."
    SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "Insufficient permissions"
    SpeechRecognizer.ERROR_NETWORK -> "Network error"
    SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "Network timeout"
    SpeechRecognizer.ERROR_NO_MATCH -> "No match"
    SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "Recognizer busy"
    SpeechRecognizer.ERROR_SERVER -> "Server error"
    SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "Speech timeout"
    else -> "Unknown error"
  }

  override fun onReadyForSpeech(params: Bundle?) {
    Log.d(logTag, "onReadyForSpeech")
    emitState("ready")
  }

  override fun onBeginningOfSpeech() {
    Log.d(logTag, "onBeginningOfSpeech")
    emitState("begin")
  }

  override fun onRmsChanged(rmsdB: Float) = Unit

  override fun onBufferReceived(buffer: ByteArray?) = Unit

  override fun onEndOfSpeech() {
    Log.d(logTag, "onEndOfSpeech")
    emitState("end")
  }

  override fun onError(error: Int) {
    Log.e(logTag, "onError code=$error message=${errorMessage(error)}")
    
    // Ignore common "errors" that are actually normal - user didn't speak or paused
    if (error == SpeechRecognizer.ERROR_NO_MATCH || error == SpeechRecognizer.ERROR_SPEECH_TIMEOUT) {
      Log.d(logTag, "Ignoring expected error: ${errorMessage(error)} - NOT restarting")
      // Don't emit error, don't restart - just stay quiet and wait for user to speak
      return
    }
    
    // Only emit and restart for real errors
    emitError(error)
    
    if (shouldRestart && isListening) {
      Log.d(logTag, "Restarting recognizer after error...")
      mainHandler.postDelayed({ startRecognizer() }, 400)
    }
  }

  override fun onResults(results: Bundle?) {
    Log.d(logTag, "onResults continuous=$shouldRestart")
    val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
    val text = matches?.firstOrNull()
    if (!text.isNullOrBlank()) {
      Log.d(logTag, "Result text: $text")
      emitResult(text, true)
    } else {
      Log.d(logTag, "No text in results")
    }
    
    // Only restart if continuous mode is enabled
    if (shouldRestart && isListening) {
      Log.d(logTag, "Continuous mode - restarting recognizer")
      mainHandler.postDelayed({ startRecognizer() }, 300)
    } else {
      Log.d(logTag, "One-shot mode - not restarting")
    }
  }

  override fun onPartialResults(partialResults: Bundle?) {
    Log.d(logTag, "onPartialResults")
    val matches = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
    val text = matches?.firstOrNull()
    if (!text.isNullOrBlank()) {
      emitResult(text, false)
    }
  }

  override fun onEvent(eventType: Int, params: Bundle?) = Unit

  override fun onHostResume() = Unit

  override fun onHostPause() = Unit

  override fun onHostDestroy() {
    shouldRestart = false
    isListening = false
    Log.d(logTag, "onHostDestroy")
    mainHandler.post {
      speechRecognizer?.destroy()
      speechRecognizer = null
    }
  }
}
