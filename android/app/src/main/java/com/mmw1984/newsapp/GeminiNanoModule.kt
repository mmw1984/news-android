package com.mmw1984.newsapp

import android.os.Handler
import android.os.Looper
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.mlkit.genai.common.DownloadCallback
import com.google.mlkit.genai.common.FeatureStatus
import com.google.mlkit.genai.common.GenAiException
import com.google.mlkit.genai.summarization.Summarization
import com.google.mlkit.genai.summarization.SummarizationRequest
import com.google.mlkit.genai.summarization.Summarizer
import com.google.mlkit.genai.summarization.SummarizerOptions

class GeminiNanoModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val mainHandler = Handler(Looper.getMainLooper())
    private var summarizer: Summarizer? = null

    override fun getName(): String {
        return "GeminiNano"
    }

    private fun getSummarizerInstance(): Summarizer {
        if (summarizer == null) {
            val options = SummarizerOptions.builder(reactApplicationContext)
                .setInputType(SummarizerOptions.InputType.ARTICLE)
                .setOutputType(SummarizerOptions.OutputType.THREE_BULLETS)
                .build()
            summarizer = Summarization.getClient(options)
        }
        return summarizer!!
    }

    @ReactMethod
    fun checkAvailability(promise: Promise) {
        mainHandler.post {
            try {
                val client = getSummarizerInstance()
                client.checkFeatureStatus()
                    .addOnSuccessListener { status ->
                        val statusStr = when (status) {
                            FeatureStatus.AVAILABLE -> "AVAILABLE"
                            FeatureStatus.DOWNLOADABLE -> "DOWNLOADABLE"
                            FeatureStatus.DOWNLOADING -> "DOWNLOADING"
                            FeatureStatus.UNAVAILABLE -> "UNAVAILABLE"
                            else -> "UNKNOWN"
                        }
                        promise.resolve(statusStr)
                    }
                    .addOnFailureListener { e ->
                        promise.reject("CHECK_STATUS_FAILED", e.message, e)
                    }
            } catch (e: Exception) {
                promise.resolve("UNAVAILABLE")
            }
        }
    }

    @ReactMethod
    fun downloadModel(promise: Promise) {
        mainHandler.post {
            try {
                val client = getSummarizerInstance()
                client.downloadFeature(object : DownloadCallback {
                    override fun onDownloadStarted(bytesToDownload: Long) {
                        sendDownloadEvent("onDownloadStarted", bytesToDownload, 0)
                    }

                    override fun onDownloadProgress(totalBytesDownloaded: Long) {
                        sendDownloadEvent("onDownloadProgress", 0, totalBytesDownloaded)
                    }

                    override fun onDownloadCompleted() {
                        sendDownloadEvent("onDownloadCompleted", 0, 0)
                        promise.resolve(null)
                    }

                    override fun onDownloadFailed(e: GenAiException) {
                        sendDownloadEvent("onDownloadFailed", 0, 0)
                        promise.reject("DOWNLOAD_FAILED", e.message, e)
                    }
                })
            } catch (e: Exception) {
                promise.reject("DOWNLOAD_FAILED", e.message, e)
            }
        }
    }

    @ReactMethod
    fun summarizeText(text: String, promise: Promise) {
        mainHandler.post {
            try {
                val client = getSummarizerInstance()
                val request = SummarizationRequest.builder(text).build()
                client.runInference(request)
                    .addOnSuccessListener { result ->
                        promise.resolve(result.summary)
                    }
                    .addOnFailureListener { e ->
                        promise.reject("SUMMARIZE_FAILED", e.message, e)
                    }
            } catch (e: Exception) {
                promise.reject("SUMMARIZE_FAILED", e.message, e)
            }
        }
    }

    private fun sendDownloadEvent(eventName: String, bytesToDownload: Long, bytesDownloaded: Long) {
        val params = Arguments.createMap().apply {
            putString("status", eventName)
            putDouble("bytesToDownload", bytesToDownload.toDouble())
            putDouble("bytesDownloaded", bytesDownloaded.toDouble())
        }
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("GeminiModelDownload", params)
    }
}
