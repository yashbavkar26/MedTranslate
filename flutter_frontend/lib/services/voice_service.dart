import 'package:flutter_tts/flutter_tts.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;

/// Shared voice service — singleton for STT and TTS across the app.
class VoiceService {
  VoiceService._();
  static final VoiceService instance = VoiceService._();

  final stt.SpeechToText _speech = stt.SpeechToText();
  final FlutterTts _tts = FlutterTts();

  bool _speechInitialized = false;
  bool _ttsInitialized = false;
  bool _isListening = false;
  bool _isSpeaking = false;

  bool get isListening => _isListening;
  bool get isSpeaking => _isSpeaking;

  // ── TTS ─────────────────────────────────────────────────────
  Future<void> _initTts() async {
    if (_ttsInitialized) return;
    await _tts.setLanguage('en-US');
    await _tts.setSpeechRate(0.45);
    await _tts.setPitch(1.0);
    await _tts.setVolume(1.0);
    _tts.setCompletionHandler(() {
      _isSpeaking = false;
    });
    _ttsInitialized = true;
  }

  Future<void> speak(String text, {Function? onComplete}) async {
    await _initTts();
    // Stop if already speaking
    if (_isSpeaking) {
      await stop();
      return;
    }
    _isSpeaking = true;
    _tts.setCompletionHandler(() {
      _isSpeaking = false;
      onComplete?.call();
    });
    await _tts.speak(text);
  }

  Future<void> stop() async {
    await _tts.stop();
    _isSpeaking = false;
  }

  // ── STT ─────────────────────────────────────────────────────
  Future<bool> initSpeech() async {
    if (_speechInitialized) return true;
    _speechInitialized = await _speech.initialize(
      onError: (error) {
        _isListening = false;
      },
      onStatus: (status) {
        if (status == 'done' || status == 'notListening') {
          _isListening = false;
        }
      },
    );
    return _speechInitialized;
  }

  Future<void> startListening({
    required Function(String text) onResult,
    Function? onListeningStarted,
    Function? onListeningStopped,
  }) async {
    final available = await initSpeech();
    if (!available) return;

    _isListening = true;
    onListeningStarted?.call();

    await _speech.listen(
      onResult: (result) {
        onResult(result.recognizedWords);
        if (result.finalResult) {
          _isListening = false;
          onListeningStopped?.call();
        }
      },
      listenFor: const Duration(seconds: 30),
      pauseFor: const Duration(seconds: 3),
      listenOptions: stt.SpeechListenOptions(
        partialResults: true,
        cancelOnError: true,
      ),
    );
  }

  Future<void> stopListening() async {
    await _speech.stop();
    _isListening = false;
  }
}
