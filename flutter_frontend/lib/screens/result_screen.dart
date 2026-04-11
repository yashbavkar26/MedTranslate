import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';
import '../services/voice_service.dart';
import 'chat_screen.dart';

class ResultScreen extends StatefulWidget {
  final String aiResponse;
  final String? safetyNotice;
  final String? model;
  final String? sessionId;

  const ResultScreen({
    super.key,
    required this.aiResponse,
    this.safetyNotice,
    this.model,
    this.sessionId,
  });

  @override
  State<ResultScreen> createState() => _ResultScreenState();
}

class _ResultScreenState extends State<ResultScreen>
    with TickerProviderStateMixin {
  late AnimationController _fadeCtrl;
  late AnimationController _slideCtrl;
  late Animation<double> _fade;
  late Animation<Offset> _slide;

  // Parsed result fields
  String _explanation = '';
  String _urgency = '';
  String _uncertainty = '';
  List<String> _safeNextSteps = [];
  List<String> _warningSigns = [];
  String _doctorVisitGuidance = '';
  List<Map<String, String>> _homeRemedies = [];
  bool _isParsed = false;
  bool _isSpeaking = false;
  final _voice = VoiceService.instance;

  @override
  void initState() {
    super.initState();
    _fadeCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 700));
    _slideCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 600));
    _fade = CurvedAnimation(parent: _fadeCtrl, curve: Curves.easeIn);
    _slide = Tween<Offset>(begin: const Offset(0, 0.1), end: Offset.zero)
        .animate(CurvedAnimation(parent: _slideCtrl, curve: Curves.easeOut));
    _fadeCtrl.forward();
    _slideCtrl.forward();

    _parseResponse();

    // Auto-speak the explanation after a short delay
    Future.delayed(const Duration(milliseconds: 1200), () {
      if (mounted) {
        final textToSpeak = _isParsed && _explanation.isNotEmpty
            ? _explanation
            : widget.aiResponse;
        _speakText(textToSpeak);
      }
    });
  }

  void _parseResponse() {
    try {
      final parsed = jsonDecode(widget.aiResponse);
      if (parsed is Map<String, dynamic>) {
        setState(() {
          _explanation = parsed['explanation'] as String? ?? '';
          _urgency = parsed['urgency'] as String? ?? '';
          _uncertainty = parsed['uncertainty'] as String? ?? '';
          _safeNextSteps = (parsed['safeNextSteps'] as List<dynamic>?)
                  ?.map((e) => e.toString())
                  .toList() ??
              [];
          _warningSigns = (parsed['warningSigns'] as List<dynamic>?)
                  ?.map((e) => e.toString())
                  .toList() ??
              [];
          _doctorVisitGuidance =
              parsed['doctorVisitGuidance'] as String? ?? '';
          _homeRemedies = (parsed['homeRemedies'] as List<dynamic>?)
                  ?.map((e) => Map<String, String>.from(
                      (e as Map).map((k, v) => MapEntry(k.toString(), v.toString()))))
                  .toList() ??
              [];
          _isParsed = true;
        });
      }
    } catch (_) {
      // Response is plain text, not JSON
      _isParsed = false;
    }
  }

  @override
  void dispose() {
    _fadeCtrl.dispose();
    _slideCtrl.dispose();
    _voice.stop();
    super.dispose();
  }

  Future<void> _speakText(String text) async {
    if (_isSpeaking) {
      await _voice.stop();
      setState(() => _isSpeaking = false);
      return;
    }
    setState(() => _isSpeaking = true);
    await _voice.speak(text, onComplete: () {
      if (mounted) setState(() => _isSpeaking = false);
    });
  }

  Color _urgencyColor(String u) => switch (u) {
        'urgent' => AppTheme.errorColor,
        'soon' => AppTheme.warningColor,
        _ => AppTheme.successColor,
      };

  IconData _urgencyIcon(String u) => switch (u) {
        'urgent' => Icons.error_rounded,
        'soon' => Icons.warning_amber_rounded,
        _ => Icons.check_circle_rounded,
      };

  String _urgencyLabel(String u) => switch (u) {
        'urgent' => 'Urgent — Seek care immediately',
        'soon' => 'Visit a doctor soon',
        _ => 'Self-care — Monitor at home',
      };

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgColor,
      body: FadeTransition(
        opacity: _fade,
        child: CustomScrollView(
          slivers: [
            SliverAppBar(
              expandedHeight: 140,
              pinned: true,
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
              actions: [
                if (widget.sessionId != null)
                  IconButton(
                    icon: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        gradient: AppTheme.primaryGradient,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.chat_rounded,
                          size: 16, color: Colors.white),
                    ),
                    onPressed: () {
                      Navigator.of(context).push(MaterialPageRoute(
                        builder: (_) => ChatScreen(
                          sessionId: widget.sessionId!,
                          initialResponse: widget.aiResponse,
                        ),
                      ));
                    },
                  ),
                const SizedBox(width: 8),
              ],
              flexibleSpace: FlexibleSpaceBar(
                background: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        AppTheme.bgSecondary,
                        _isParsed
                            ? _urgencyColor(_urgency).withAlpha(50)
                            : AppTheme.primaryColor.withAlpha(76),
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  child: SafeArea(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(20, 60, 20, 20),
                      child: Row(
                        children: [
                          Container(
                            width: 56,
                            height: 56,
                            decoration: BoxDecoration(
                              gradient: AppTheme.primaryGradient,
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: const Icon(Icons.auto_awesome_rounded,
                                color: Colors.white, size: 28),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text('AI Analysis Complete',
                                    style: GoogleFonts.inter(
                                        fontSize: 18,
                                        fontWeight: FontWeight.w700,
                                        color: AppTheme.textPrimary)),
                                const SizedBox(height: 4),
                                Text(
                                    'Model: ${widget.model ?? 'LLaMA 3.1'}',
                                    style: GoogleFonts.inter(
                                        fontSize: 12,
                                        color: AppTheme.textSecondary)),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: SlideTransition(
                position: _slide,
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Urgency banner
                      if (_isParsed && _urgency.isNotEmpty)
                        Container(
                          padding: const EdgeInsets.all(16),
                          margin: const EdgeInsets.only(bottom: 16),
                          decoration: BoxDecoration(
                            color: _urgencyColor(_urgency).withAlpha(20),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                                color: _urgencyColor(_urgency).withAlpha(76)),
                          ),
                          child: Row(
                            children: [
                              Icon(_urgencyIcon(_urgency),
                                  color: _urgencyColor(_urgency), size: 24),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(_urgencyLabel(_urgency),
                                    style: GoogleFonts.inter(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w600,
                                        color: _urgencyColor(_urgency))),
                              ),
                            ],
                          ),
                        ),

                      // AI Summary / Explanation
                      _SectionCard(
                        icon: Icons.auto_awesome_rounded,
                        title: 'AI Explanation',
                        gradient: true,
                        trailing: GestureDetector(
                          onTap: () => _speakText(
                              _isParsed ? _explanation : widget.aiResponse),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: _isSpeaking
                                  ? AppTheme.primaryColor.withAlpha(40)
                                  : Colors.white.withAlpha(15),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Icon(
                              _isSpeaking
                                  ? Icons.stop_rounded
                                  : Icons.volume_up_rounded,
                              size: 18,
                              color: _isSpeaking
                                  ? AppTheme.primaryColor
                                  : AppTheme.textSecondary,
                            ),
                          ),
                        ),
                        child: SelectableText(
                          _isParsed
                              ? _explanation
                              : widget.aiResponse,
                          style: GoogleFonts.inter(
                              fontSize: 13,
                              color: AppTheme.textSecondary,
                              height: 1.6),
                        ),
                      ),
                      const SizedBox(height: 14),

                      // Uncertainty
                      if (_isParsed && _uncertainty.isNotEmpty) ...[
                        _SectionCard(
                          icon: Icons.help_outline_rounded,
                          title: 'What We\'re Uncertain About',
                          color: AppTheme.infoColor,
                          child: Text(_uncertainty,
                              style: GoogleFonts.inter(
                                  fontSize: 13,
                                  color: AppTheme.textSecondary,
                                  height: 1.6)),
                        ),
                        const SizedBox(height: 14),
                      ],

                      // Safe Next Steps
                      if (_isParsed && _safeNextSteps.isNotEmpty) ...[
                        _SectionCard(
                          icon: Icons.checklist_rounded,
                          title: 'Safe Next Steps',
                          color: AppTheme.successColor,
                          child: Column(
                            children: _safeNextSteps
                                .asMap()
                                .entries
                                .map((e) => Padding(
                                      padding: const EdgeInsets.only(bottom: 8),
                                      child: Row(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Container(
                                            width: 22,
                                            height: 22,
                                            margin: const EdgeInsets.only(
                                                right: 10),
                                            decoration: BoxDecoration(
                                              color: AppTheme.successColor
                                                  .withAlpha(30),
                                              borderRadius:
                                                  BorderRadius.circular(6),
                                            ),
                                            child: Center(
                                              child: Text('${e.key + 1}',
                                                  style: GoogleFonts.inter(
                                                      fontSize: 11,
                                                      fontWeight:
                                                          FontWeight.w600,
                                                      color: AppTheme
                                                          .successColor)),
                                            ),
                                          ),
                                          Expanded(
                                            child: Text(e.value,
                                                style: GoogleFonts.inter(
                                                    fontSize: 13,
                                                    color:
                                                        AppTheme.textSecondary,
                                                    height: 1.5)),
                                          ),
                                        ],
                                      ),
                                    ))
                                .toList(),
                          ),
                        ),
                        const SizedBox(height: 14),
                      ],

                      // Warning Signs
                      if (_isParsed && _warningSigns.isNotEmpty) ...[
                        _SectionCard(
                          icon: Icons.warning_amber_rounded,
                          title: 'Warning Signs to Watch',
                          color: AppTheme.warningColor,
                          child: Column(
                            children: _warningSigns
                                .map((s) => Padding(
                                      padding: const EdgeInsets.only(bottom: 8),
                                      child: Row(
                                        children: [
                                          const Icon(
                                              Icons.priority_high_rounded,
                                              color: AppTheme.warningColor,
                                              size: 16),
                                          const SizedBox(width: 10),
                                          Expanded(
                                            child: Text(s,
                                                style: GoogleFonts.inter(
                                                    fontSize: 13,
                                                    color:
                                                        AppTheme.textSecondary,
                                                    height: 1.5)),
                                          ),
                                        ],
                                      ),
                                    ))
                                .toList(),
                          ),
                        ),
                        const SizedBox(height: 14),
                      ],

                      // Doctor Visit Guidance
                      if (_isParsed && _doctorVisitGuidance.isNotEmpty) ...[
                        _SectionCard(
                          icon: Icons.local_hospital_rounded,
                          title: 'Doctor Visit Guidance',
                          color: AppTheme.primaryColor,
                          child: Text(_doctorVisitGuidance,
                              style: GoogleFonts.inter(
                                  fontSize: 13,
                                  color: AppTheme.textSecondary,
                                  height: 1.6)),
                        ),
                        const SizedBox(height: 14),
                      ],

                      // Home Remedies
                      if (_isParsed && _homeRemedies.isNotEmpty) ...[
                        _SectionCard(
                          icon: Icons.spa_rounded,
                          title: 'Home Remedies',
                          color: const Color(0xFF00C6AE),
                          child: Column(
                            children: _homeRemedies
                                .map((r) => Container(
                                      margin: const EdgeInsets.only(bottom: 10),
                                      padding: const EdgeInsets.all(12),
                                      decoration: BoxDecoration(
                                        color: AppTheme.bgCardLight,
                                        borderRadius:
                                            BorderRadius.circular(12),
                                        border: Border.all(
                                            color: AppTheme.borderColor),
                                      ),
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(r['remedy'] ?? '',
                                              style: GoogleFonts.inter(
                                                  fontSize: 13,
                                                  fontWeight: FontWeight.w600,
                                                  color:
                                                      AppTheme.textPrimary)),
                                          const SizedBox(height: 4),
                                          Text(r['instruction'] ?? '',
                                              style: GoogleFonts.inter(
                                                  fontSize: 12,
                                                  color:
                                                      AppTheme.textSecondary,
                                                  height: 1.5)),
                                        ],
                                      ),
                                    ))
                                .toList(),
                          ),
                        ),
                        const SizedBox(height: 14),
                      ],

                      // Chat follow-up button
                      if (widget.sessionId != null) ...[
                        const SizedBox(height: 8),
                        GestureDetector(
                          onTap: () {
                            Navigator.of(context).push(MaterialPageRoute(
                              builder: (_) => ChatScreen(
                                sessionId: widget.sessionId!,
                                initialResponse: widget.aiResponse,
                              ),
                            ));
                          },
                          child: Container(
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            decoration: BoxDecoration(
                              gradient: AppTheme.primaryGradient,
                              borderRadius: BorderRadius.circular(16),
                              boxShadow: [
                                BoxShadow(
                                  color: AppTheme.primaryColor.withAlpha(80),
                                  blurRadius: 16,
                                  offset: const Offset(0, 6),
                                ),
                              ],
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.chat_rounded,
                                    color: Colors.white, size: 20),
                                const SizedBox(width: 10),
                                Text('Ask Follow-Up Questions',
                                    style: GoogleFonts.inter(
                                        fontSize: 15,
                                        fontWeight: FontWeight.w600,
                                        color: Colors.white)),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 14),
                      ],

                      // Safety disclaimer
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: AppTheme.warningColor.withAlpha(20),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                              color: AppTheme.warningColor.withAlpha(64)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.warning_amber_rounded,
                                color: AppTheme.warningColor, size: 18),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                widget.safetyNotice ??
                                    'AI-generated analysis for informational purposes only. Always consult a qualified healthcare professional.',
                                style: GoogleFonts.inter(
                                    fontSize: 11,
                                    color: AppTheme.warningColor,
                                    height: 1.5),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final Widget child;
  final Color? color;
  final bool gradient;
  final Widget? trailing;

  const _SectionCard({
    required this.icon,
    required this.title,
    required this.child,
    this.color,
    this.gradient = false,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    final c = color ?? AppTheme.primaryColor;
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: gradient
            ? LinearGradient(colors: [
                AppTheme.accentColor.withAlpha(38),
                AppTheme.primaryColor.withAlpha(25),
              ])
            : null,
        color: gradient ? null : c.withAlpha(12),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: c.withAlpha(50)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: c.withAlpha(30),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: c, size: 18),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(title,
                    style: GoogleFonts.inter(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.textPrimary)),
              ),
              if (trailing != null) trailing!,
            ],
          ),
          const SizedBox(height: 14),
          child,
        ],
      ),
    );
  }
}

