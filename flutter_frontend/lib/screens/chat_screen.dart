import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';
import '../services/api_service.dart';
import '../services/voice_service.dart';

class ChatScreen extends StatefulWidget {
  final String sessionId;
  final String initialResponse;

  const ChatScreen({
    super.key,
    required this.sessionId,
    required this.initialResponse,
  });

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> with TickerProviderStateMixin {
  final _controller = TextEditingController();
  final _scrollController = ScrollController();
  final List<_ChatMessage> _messages = [];
  bool _isSending = false;
  bool _isListening = false;
  bool _isSpeaking = false;
  final _voice = VoiceService.instance;

  late AnimationController _fadeCtrl;
  late Animation<double> _fade;

  @override
  void initState() {
    super.initState();
    _fadeCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 500));
    _fade = CurvedAnimation(parent: _fadeCtrl, curve: Curves.easeIn);
    _fadeCtrl.forward();

    // Add the initial AI response as first message
    _messages.add(_ChatMessage(
      text: widget.initialResponse,
      isUser: false,
      timestamp: DateTime.now(),
    ));
  }

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    _fadeCtrl.dispose();
    _voice.stop();
    super.dispose();
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _sendMessage() async {
    final text = _controller.text.trim();
    if (text.isEmpty || _isSending) return;

    setState(() {
      _messages.add(_ChatMessage(
        text: text,
        isUser: true,
        timestamp: DateTime.now(),
      ));
      _isSending = true;
    });
    _controller.clear();
    _scrollToBottom();

    try {
      final result = await ApiService.chat(widget.sessionId, text);
      final aiResponse = result['response'] as String? ?? 'No response received.';

      if (mounted) {
        setState(() {
          _messages.add(_ChatMessage(
            text: aiResponse,
            isUser: false,
            timestamp: DateTime.now(),
          ));
          _isSending = false;
        });
        _scrollToBottom();
        // Auto-speak AI response
        _speakText(aiResponse);
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _messages.add(_ChatMessage(
            text: 'Error: ${e.toString()}',
            isUser: false,
            isError: true,
            timestamp: DateTime.now(),
          ));
          _isSending = false;
        });
        _scrollToBottom();
      }
    }
  }

  Future<void> _toggleListening() async {
    if (_isListening) {
      await _voice.stopListening();
      setState(() => _isListening = false);
    } else {
      await _voice.startListening(
        onResult: (text) {
          if (mounted) setState(() => _controller.text = text);
        },
        onListeningStarted: () {
          if (mounted) setState(() => _isListening = true);
        },
        onListeningStopped: () {
          if (mounted) setState(() => _isListening = false);
        },
      );
      setState(() => _isListening = true);
    }
  }

  Future<void> _speakText(String text) async {
    // Try to parse JSON and speak explanation field
    String toSpeak = text;
    try {
      final parsed = Map<String, dynamic>.from(
          (text.startsWith('{')) ? _tryParse(text) : {});
      if (parsed.containsKey('explanation')) {
        toSpeak = parsed['explanation'] as String;
      }
    } catch (_) {}

    setState(() => _isSpeaking = true);
    await _voice.speak(toSpeak, onComplete: () {
      if (mounted) setState(() => _isSpeaking = false);
    });
  }

  dynamic _tryParse(String text) {
    try {
      return Map<String, dynamic>.from(
          text.startsWith('{') ? _decodeJson(text) : {});
    } catch (_) {
      return {};
    }
  }

  Map<String, dynamic> _decodeJson(String text) {
    return Map<String, dynamic>.from(
        (const JsonDecoder()).convert(text) as Map);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgColor,
      appBar: AppBar(
        backgroundColor: AppTheme.bgSecondary,
        leading: IconButton(
          onPressed: () => Navigator.pop(context),
          icon: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white.withAlpha(25),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.arrow_back_ios_new_rounded,
                size: 16, color: Colors.white),
          ),
        ),
        title: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                gradient: AppTheme.primaryGradient,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.auto_awesome_rounded,
                  color: Colors.white, size: 18),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('MedTranslate AI',
                    style: GoogleFonts.inter(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.textPrimary)),
                Text(
                    _isSending ? 'Thinking...' : 'Online',
                    style: GoogleFonts.inter(
                        fontSize: 11,
                        color: _isSending
                            ? AppTheme.warningColor
                            : AppTheme.successColor)),
              ],
            ),
          ],
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: AppTheme.borderColor),
        ),
      ),
      body: FadeTransition(
        opacity: _fade,
        child: Column(
          children: [
            // Messages list
            Expanded(
              child: ListView.builder(
                controller: _scrollController,
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                itemCount: _messages.length + (_isSending ? 1 : 0),
                itemBuilder: (context, index) {
                  if (index == _messages.length && _isSending) {
                    return _buildTypingIndicator();
                  }
                  return _buildMessageBubble(_messages[index]);
                },
              ),
            ),

            // Input bar
            Container(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
              decoration: BoxDecoration(
                color: AppTheme.bgSecondary,
                border: const Border(
                    top: BorderSide(color: AppTheme.borderColor, width: 0.5)),
              ),
              child: SafeArea(
                top: false,
                child: Row(
                  children: [
                    // Mic button
                    GestureDetector(
                      onTap: _toggleListening,
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          gradient: _isListening
                              ? const LinearGradient(
                                  colors: [Color(0xFFFF6B6B), Color(0xFFFF9F43)])
                              : null,
                          color: _isListening ? null : AppTheme.bgCard,
                          borderRadius: BorderRadius.circular(14),
                          border: _isListening
                              ? null
                              : Border.all(color: AppTheme.borderColor),
                        ),
                        child: Icon(
                          _isListening ? Icons.stop_rounded : Icons.mic_rounded,
                          color: _isListening
                              ? Colors.white
                              : AppTheme.primaryColor,
                          size: 20,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Container(
                        decoration: BoxDecoration(
                          color: AppTheme.bgCard,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: _isListening
                                ? AppTheme.errorColor
                                : AppTheme.borderColor,
                          ),
                        ),
                        child: TextField(
                          controller: _controller,
                          style: GoogleFonts.inter(
                              fontSize: 14, color: AppTheme.textPrimary),
                          maxLines: 3,
                          minLines: 1,
                          textInputAction: TextInputAction.send,
                          onSubmitted: (_) => _sendMessage(),
                          decoration: InputDecoration(
                            hintText: _isListening
                                ? 'Listening... 🎙️'
                                : 'Ask about your report...',
                            hintStyle: GoogleFonts.inter(
                                fontSize: 14,
                                color: _isListening
                                    ? AppTheme.errorColor
                                    : AppTheme.textSecondary),
                            border: InputBorder.none,
                            contentPadding: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 12),
                            filled: false,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    GestureDetector(
                      onTap: _sendMessage,
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          gradient: _isSending
                              ? null
                              : AppTheme.primaryGradient,
                          color: _isSending
                              ? AppTheme.bgCard
                              : null,
                          borderRadius: BorderRadius.circular(14),
                          boxShadow: _isSending
                              ? null
                              : [
                                  BoxShadow(
                                    color: AppTheme.primaryColor.withAlpha(80),
                                    blurRadius: 12,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                        ),
                        child: Icon(
                          Icons.send_rounded,
                          color: _isSending
                              ? AppTheme.textSecondary
                              : Colors.white,
                          size: 20,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMessageBubble(_ChatMessage message) {
    final isUser = message.isUser;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment:
            isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isUser) ...[
            Container(
              width: 30,
              height: 30,
              decoration: BoxDecoration(
                gradient: AppTheme.primaryGradient,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.auto_awesome_rounded,
                  color: Colors.white, size: 14),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: isUser
                    ? AppTheme.primaryColor.withAlpha(40)
                    : message.isError
                        ? AppTheme.errorColor.withAlpha(20)
                        : AppTheme.bgCard,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(18),
                  topRight: const Radius.circular(18),
                  bottomLeft: Radius.circular(isUser ? 18 : 4),
                  bottomRight: Radius.circular(isUser ? 4 : 18),
                ),
                border: Border.all(
                  color: isUser
                      ? AppTheme.primaryColor.withAlpha(60)
                      : message.isError
                          ? AppTheme.errorColor.withAlpha(60)
                          : AppTheme.borderColor,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SelectableText(
                    message.text,
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      color: message.isError
                          ? AppTheme.errorColor
                          : AppTheme.textPrimary,
                      height: 1.5,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        _formatTime(message.timestamp),
                        style: GoogleFonts.inter(
                            fontSize: 10,
                            color: AppTheme.textSecondary.withAlpha(153)),
                      ),
                      if (!isUser && !message.isError)
                        GestureDetector(
                          onTap: () => _speakText(message.text),
                          child: Icon(
                            _isSpeaking
                                ? Icons.volume_off_rounded
                                : Icons.volume_up_rounded,
                            size: 16,
                            color: AppTheme.primaryColor.withAlpha(180),
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          if (isUser) ...[
            const SizedBox(width: 8),
            Container(
              width: 30,
              height: 30,
              decoration: BoxDecoration(
                color: AppTheme.accentColor.withAlpha(40),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Center(
                child: Text('Y',
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 13,
                        fontWeight: FontWeight.w600)),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildTypingIndicator() {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Container(
            width: 30,
            height: 30,
            decoration: BoxDecoration(
              gradient: AppTheme.primaryGradient,
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.auto_awesome_rounded,
                color: Colors.white, size: 14),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            decoration: BoxDecoration(
              color: AppTheme.bgCard,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(18),
                topRight: Radius.circular(18),
                bottomLeft: Radius.circular(4),
                bottomRight: Radius.circular(18),
              ),
              border: Border.all(color: AppTheme.borderColor),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _TypingDot(delay: 0),
                const SizedBox(width: 4),
                _TypingDot(delay: 150),
                const SizedBox(width: 4),
                _TypingDot(delay: 300),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _formatTime(DateTime time) {
    final hour = time.hour % 12 == 0 ? 12 : time.hour % 12;
    final minute = time.minute.toString().padLeft(2, '0');
    final period = time.hour < 12 ? 'AM' : 'PM';
    return '$hour:$minute $period';
  }
}

class _ChatMessage {
  final String text;
  final bool isUser;
  final bool isError;
  final DateTime timestamp;

  _ChatMessage({
    required this.text,
    required this.isUser,
    this.isError = false,
    required this.timestamp,
  });
}

class _TypingDot extends StatefulWidget {
  final int delay;
  const _TypingDot({required this.delay});

  @override
  State<_TypingDot> createState() => _TypingDotState();
}

class _TypingDotState extends State<_TypingDot>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 600))
      ..repeat(reverse: true);
    _anim = Tween<double>(begin: 0.3, end: 1.0).animate(
        CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut));
    Future.delayed(Duration(milliseconds: widget.delay), () {
      if (mounted) _ctrl.forward();
    });
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _anim,
      builder: (_, __) => Container(
        width: 8,
        height: 8,
        decoration: BoxDecoration(
          color: AppTheme.primaryColor.withAlpha((_anim.value * 255).toInt()),
          shape: BoxShape.circle,
        ),
      ),
    );
  }
}
