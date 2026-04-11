import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:file_picker/file_picker.dart';
import '../theme/app_theme.dart';
import '../services/api_service.dart';
import '../services/voice_service.dart';
import 'result_screen.dart';
import 'chat_screen.dart';
import 'profile_screen.dart';
import 'history_screen.dart';
import 'dart:convert';
import '../services/history_service.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with TickerProviderStateMixin {
  int _selectedIndex = 0;
  int _inputMode = 0;
  bool _isAnalyzing = false;
  final _textController = TextEditingController();
  String? _selectedFileName;
  File? _selectedFile;
  bool _isListening = false;
  final _voice = VoiceService.instance;

  // Chat sessions
  String? _activeSessionId;
  String? _activeSessionResponse;

  late AnimationController _fadeCtrl;
  late AnimationController _pulseCtrl;
  late Animation<double> _fade;
  late Animation<double> _pulse;

  List<Map<String, dynamic>> _recentReports = [];

  static const _stats = [
    {'label': 'Reports', 'value': '12', 'icon': Icons.description_rounded, 'color': Color(0xFF6C63FF)},
    {'label': 'Insights', 'value': '48', 'icon': Icons.insights_rounded, 'color': Color(0xFF00C6AE)},
    {'label': 'Streak',  'value': '7d', 'icon': Icons.local_fire_department_rounded, 'color': Color(0xFFFF9F43)},
  ];

  @override
  void initState() {
    super.initState();
    _loadRecentReports();
    _fadeCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 700));
    _pulseCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1200))
      ..repeat(reverse: true);
    _fade = CurvedAnimation(parent: _fadeCtrl, curve: Curves.easeIn);
    _pulse = Tween<double>(begin: 0.97, end: 1.03)
        .animate(CurvedAnimation(parent: _pulseCtrl, curve: Curves.easeInOut));
    _fadeCtrl.forward();
  }

  Future<void> _loadRecentReports() async {
    final reports = await HistoryService.getReports();
    if (mounted) {
      setState(() {
        _recentReports = reports.take(3).toList();
      });
    }
  }

  @override
  void dispose() {
    _textController.dispose();
    _fadeCtrl.dispose();
    _pulseCtrl.dispose();
    super.dispose();
  }

  Future<void> _saveToHistory(String response, int mode) async {
    try {
      final decoded = jsonDecode(response);
      final report = {
        'title': mode == 0 ? 'Text Analysis' : 'PDF Document Upload',
        'date': DateTime.now().toString().split(' ')[0], // simple date string YYYY-MM-DD
        'type': mode == 0 ? 'Text' : 'PDF',
        'explanation': decoded['explanation'] ?? '',
        'urgency': decoded['urgency'] ?? 'self_care',
        'score': decoded['urgency'] == 'urgent' ? 60 : (decoded['urgency'] == 'soon' ? 80 : 95),
        'tags': decoded['affectedBodyParts'] ?? [],
      };
      await HistoryService.saveReport(report);
    } catch (e) {
      // If parsing fails or anything goes wrong, we just don't save history, or save a generic one to avoid crashing
      final report = {
        'title': mode == 0 ? 'Text Analysis' : 'PDF Document Upload',
        'date': DateTime.now().toString().split(' ')[0],
        'type': mode == 0 ? 'Text' : 'PDF',
        'explanation': 'Result format unavailable for history short-summary.',
        'urgency': 'soon',
        'score': 85,
        'tags': [],
      };
      await HistoryService.saveReport(report);
    }
  }

  Future<void> _analyze() async {
    if (_inputMode == 0 && _textController.text.trim().isEmpty) {
      _showSnack('Please enter medical text to analyze');
      return;
    }
    if (_inputMode == 1 && _selectedFile == null) {
      _showSnack('Please select a PDF file');
      return;
    }

    setState(() => _isAnalyzing = true);

    try {
      Map<String, dynamic> result;

      if (_inputMode == 0) {
        // Text analyze mode
        result = await ApiService.analyzeText(_textController.text.trim());
        if (mounted) {
          final aiResponse = result['response'] as String? ?? 'No response';
          _saveToHistory(aiResponse, 0); // background save
          setState(() => _isAnalyzing = false);
          Navigator.of(context).push(MaterialPageRoute(
            builder: (_) => ResultScreen(
              aiResponse: result['response'] as String? ?? 'No response',
              safetyNotice: result['safetyNotice'] as String?,
              model: result['model'] as String?,
            ),
          ));
        }
      } else {
        // PDF upload mode
        result = await ApiService.uploadReport(_selectedFile!);
        final sessionId = result['sessionId'] as String?;
        final response = result['response'] as String? ?? 'No response';

        if (mounted) {
          _saveToHistory(response, 1); // background save
          setState(() {
            _isAnalyzing = false;
            _activeSessionId = sessionId;
            _activeSessionResponse = response;
          });
          Navigator.of(context).push(MaterialPageRoute(
            builder: (_) => ResultScreen(
              aiResponse: response,
              safetyNotice: result['safetyNotice'] as String?,
              model: result['model'] as String?,
              sessionId: sessionId,
            ),
          ));
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isAnalyzing = false);
        _showSnack('Error: ${e.toString()}');
      }
    }
  }

  void _showSnack(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg, style: GoogleFonts.inter()),
      backgroundColor: AppTheme.errorColor,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    ));
  }

  Future<void> _pickFile() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf'],
      );
      if (result != null && result.files.single.path != null) {
        setState(() {
          _selectedFileName = result.files.single.name;
          _selectedFile = File(result.files.single.path!);
        });
      }
    } catch (e) {
      _showSnack('Error picking file: $e');
    }
  }

  // ── HOME TAB ────────────────────────────────────────────────
  Widget _buildHome() {
    return FadeTransition(
      opacity: _fade,
      child: SingleChildScrollView(
        padding: const EdgeInsets.only(bottom: 100),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Container(
              padding: const EdgeInsets.fromLTRB(24, 20, 24, 28),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [AppTheme.bgSecondary, AppTheme.bgColor],
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Hello, Yash 👋',
                                style: GoogleFonts.inter(
                                    fontSize: 22,
                                    fontWeight: FontWeight.w700,
                                    color: AppTheme.textPrimary)),
                            const SizedBox(height: 4),
                            Text('What would you like to translate today?',
                                style: GoogleFonts.inter(
                                    fontSize: 13, color: AppTheme.textSecondary)),
                          ],
                        ),
                      ),
                      Container(
                        width: 46,
                        height: 46,
                        decoration: BoxDecoration(
                          gradient: AppTheme.primaryGradient,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: const Center(
                          child: Text('Y',
                              style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 18,
                                  fontWeight: FontWeight.w700)),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  Row(
                    children: _stats.asMap().entries.map((e) {
                      final s = e.value;
                      final isLast = e.key == _stats.length - 1;
                      return Expanded(
                        child: Container(
                          margin: EdgeInsets.only(right: isLast ? 0 : 10),
                          padding: const EdgeInsets.symmetric(
                              vertical: 14, horizontal: 12),
                          decoration: BoxDecoration(
                            color: AppTheme.bgCard,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: AppTheme.borderColor),
                          ),
                          child: Column(
                            children: [
                              Icon(s['icon'] as IconData,
                                  color: s['color'] as Color, size: 22),
                              const SizedBox(height: 6),
                              Text(s['value'] as String,
                                  style: GoogleFonts.inter(
                                      fontSize: 18,
                                      fontWeight: FontWeight.w700,
                                      color: AppTheme.textPrimary)),
                              Text(s['label'] as String,
                                  style: GoogleFonts.inter(
                                      fontSize: 11,
                                      color: AppTheme.textSecondary)),
                            ],
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),

            Padding(
              padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Section header
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          gradient: AppTheme.primaryGradient,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.auto_awesome_rounded,
                            size: 16, color: Colors.white),
                      ),
                      const SizedBox(width: 10),
                      Text('AI Report Analysis',
                          style: GoogleFonts.inter(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.textPrimary)),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Upload your medical report or paste text — get results in plain language',
                    style: GoogleFonts.inter(
                        fontSize: 12, color: AppTheme.textSecondary),
                  ),
                  const SizedBox(height: 16),

                  // Mode tabs
                  Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: AppTheme.bgCard,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppTheme.borderColor),
                    ),
                    child: Row(
                      children: [
                        _InputTab(
                            label: 'Text Input',
                            icon: Icons.text_fields_rounded,
                            isSelected: _inputMode == 0,
                            onTap: () => setState(() => _inputMode = 0)),
                        _InputTab(
                            label: 'PDF Upload',
                            icon: Icons.picture_as_pdf_rounded,
                            isSelected: _inputMode == 1,
                            onTap: () => setState(() => _inputMode = 1)),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Input area
                  AnimatedSwitcher(
                    duration: const Duration(milliseconds: 280),
                    child: _inputMode == 0
                        ? _buildTextInput()
                        : _buildPDFUpload(),
                  ),
                  const SizedBox(height: 16),

                  // Analyze button
                  AnimatedBuilder(
                    animation: _pulseCtrl,
                    builder: (_, child) => Transform.scale(
                      scale: _isAnalyzing ? _pulse.value : 1.0,
                      child: child,
                    ),
                    child: Container(
                      width: double.infinity,
                      height: 56,
                      decoration: BoxDecoration(
                        gradient: AppTheme.primaryGradient,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: AppTheme.primaryColor.withAlpha(100),
                            blurRadius: 20,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      child: ElevatedButton(
                        onPressed: _isAnalyzing ? null : _analyze,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.transparent,
                          shadowColor: Colors.transparent,
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16)),
                        ),
                        child: _isAnalyzing
                            ? Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: CircularProgressIndicator(
                                        color: Colors.white, strokeWidth: 2),
                                  ),
                                  const SizedBox(width: 12),
                                  Text('Analysing with AI...',
                                      style: GoogleFonts.inter(
                                          fontSize: 16,
                                          fontWeight: FontWeight.w600,
                                          color: Colors.white)),
                                ],
                              )
                            : Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Icon(Icons.auto_awesome_rounded,
                                      color: Colors.white, size: 20),
                                  const SizedBox(width: 10),
                                  Text('Analyze Report',
                                      style: GoogleFonts.inter(
                                          fontSize: 16,
                                          fontWeight: FontWeight.w600,
                                          color: Colors.white)),
                                ],
                              ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 28),

                  // Recent Reports
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Recent Reports',
                          style: GoogleFonts.inter(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.textPrimary)),
                      TextButton(
                        onPressed: () {},
                        child: Text('View all',
                            style: GoogleFonts.inter(
                                color: AppTheme.primaryColor,
                                fontSize: 13,
                                fontWeight: FontWeight.w500)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  ..._recentReports.map((r) => _ReportCard(report: r)),

                  const SizedBox(height: 20),
                  _HealthTipsBanner(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── CHAT TAB ────────────────────────────────────────────────
  Widget _buildChatTab() {
    if (_activeSessionId != null && _activeSessionResponse != null) {
      return ChatScreen(
        sessionId: _activeSessionId!,
        initialResponse: _activeSessionResponse!,
      );
    }

    // No active session — show prompt
    return Center(
      child: FadeTransition(
        opacity: _fade,
        child: Padding(
          padding: const EdgeInsets.all(40),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  gradient: LinearGradient(colors: [
                    AppTheme.primaryColor.withAlpha(40),
                    AppTheme.accentColor.withAlpha(40),
                  ]),
                  borderRadius: BorderRadius.circular(24),
                ),
                child: const Icon(Icons.chat_rounded,
                    color: AppTheme.primaryColor, size: 36),
              ),
              const SizedBox(height: 24),
              Text('No Active Chat Session',
                  style: GoogleFonts.inter(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.textPrimary)),
              const SizedBox(height: 10),
              Text(
                'Upload a PDF report first to start a chat session. You can then ask follow-up questions about your report.',
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(
                    fontSize: 13,
                    color: AppTheme.textSecondary,
                    height: 1.6),
              ),
              const SizedBox(height: 28),
              GestureDetector(
                onTap: () => setState(() => _selectedIndex = 0),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
                  decoration: BoxDecoration(
                    gradient: AppTheme.primaryGradient,
                    borderRadius: BorderRadius.circular(14),
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.primaryColor.withAlpha(80),
                        blurRadius: 16,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.upload_file_rounded,
                          color: Colors.white, size: 18),
                      const SizedBox(width: 10),
                      Text('Upload Report',
                          style: GoogleFonts.inter(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: Colors.white)),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _toggleListening() async {
    if (_isListening) {
      await _voice.stopListening();
      setState(() => _isListening = false);
    } else {
      await _voice.startListening(
        onResult: (text) {
          if (mounted) setState(() => _textController.text = text);
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

  Widget _buildTextInput() {
    return Container(
      key: const ValueKey('text'),
      decoration: BoxDecoration(
        color: AppTheme.bgCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: _isListening ? AppTheme.errorColor : AppTheme.borderColor,
        ),
      ),
      child: Column(
        children: [
          Stack(
            children: [
              TextField(
                controller: _textController,
                maxLines: 8,
                style: GoogleFonts.inter(
                    fontSize: 14, color: AppTheme.textPrimary, height: 1.6),
                decoration: InputDecoration(
                  hintText: _isListening
                      ? 'Listening... speak now 🎙️'
                      : 'Paste your medical report text here...\n\nExample: "Hemoglobin: 10.5 g/dL (Normal: 12-16), WBC: 11.2 K/μL..."',
                  hintStyle: GoogleFonts.inter(
                      fontSize: 13,
                      color: _isListening
                          ? AppTheme.errorColor
                          : AppTheme.textSecondary,
                      height: 1.6),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.all(16),
                  filled: false,
                ),
              ),
              Positioned(
                right: 8,
                top: 8,
                child: GestureDetector(
                  onTap: _toggleListening,
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      gradient: _isListening
                          ? const LinearGradient(
                              colors: [Color(0xFFFF6B6B), Color(0xFFFF9F43)])
                          : AppTheme.primaryGradient,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: (_isListening
                                  ? AppTheme.errorColor
                                  : AppTheme.primaryColor)
                              .withAlpha(80),
                          blurRadius: 10,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Icon(
                      _isListening ? Icons.stop_rounded : Icons.mic_rounded,
                      color: Colors.white,
                      size: 20,
                    ),
                  ),
                ),
              ),
            ],
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: const BoxDecoration(
              color: AppTheme.bgCardLight,
              borderRadius: BorderRadius.only(
                bottomLeft: Radius.circular(16),
                bottomRight: Radius.circular(16),
              ),
            ),
            child: Row(
              children: [
                const Icon(Icons.info_outline_rounded,
                    size: 14, color: AppTheme.textSecondary),
                const SizedBox(width: 6),
                Expanded(
                  child: Text('Supports: Lab Reports, Prescriptions, or tap 🎙️ to speak',
                      style: GoogleFonts.inter(
                          fontSize: 11, color: AppTheme.textSecondary)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPDFUpload() {
    return GestureDetector(
      key: const ValueKey('pdf'),
      onTap: _pickFile,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 32),
        decoration: BoxDecoration(
          color: _selectedFileName != null
              ? AppTheme.primaryColor.withAlpha(20)
              : AppTheme.bgCard,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: _selectedFileName != null
                ? AppTheme.primaryColor
                : AppTheme.borderColor,
          ),
        ),
        child: _selectedFileName != null
            ? Column(children: [
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor.withAlpha(38),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Icon(Icons.picture_as_pdf_rounded,
                      color: AppTheme.primaryColor, size: 30),
                ),
                const SizedBox(height: 12),
                Text(_selectedFileName!,
                    style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.textPrimary)),
                const SizedBox(height: 4),
                Text('Tap to change file',
                    style: GoogleFonts.inter(
                        fontSize: 12, color: AppTheme.primaryColor)),
              ])
            : Column(children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(colors: [
                      AppTheme.primaryColor.withAlpha(25),
                      AppTheme.accentColor.withAlpha(25),
                    ]),
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: const Icon(Icons.cloud_upload_outlined,
                      size: 40, color: AppTheme.primaryColor),
                ),
                const SizedBox(height: 14),
                Text('Upload Medical PDF',
                    style: GoogleFonts.inter(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.textPrimary)),
                const SizedBox(height: 6),
                Text('Tap to select • PDF, up to 10MB',
                    style: GoogleFonts.inter(
                        fontSize: 12, color: AppTheme.textSecondary)),
                const SizedBox(height: 14),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                  decoration: BoxDecoration(
                    gradient: AppTheme.primaryGradient,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text('Choose File',
                      style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: Colors.white)),
                ),
              ]),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final screens = [
      _buildHome(),
      _buildChatTab(),
      const HistoryScreen(),
      const ProfileScreen(),
    ];
    return Scaffold(
      backgroundColor: AppTheme.bgColor,
      body: screens[_selectedIndex],
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: AppTheme.bgSecondary,
          border:
              Border(top: BorderSide(color: AppTheme.borderColor, width: 0.5)),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 10),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _NavItem(icon: Icons.home_rounded, label: 'Home',
                    isSelected: _selectedIndex == 0,
                    onTap: () => setState(() => _selectedIndex = 0)),
                _NavItem(icon: Icons.chat_rounded, label: 'Chat',
                    isSelected: _selectedIndex == 1,
                    onTap: () => setState(() => _selectedIndex = 1)),
                _NavItem(icon: Icons.history_rounded, label: 'History',
                    isSelected: _selectedIndex == 2,
                    onTap: () => setState(() => _selectedIndex = 2)),
                _NavItem(icon: Icons.person_rounded, label: 'Profile',
                    isSelected: _selectedIndex == 3,
                    onTap: () => setState(() => _selectedIndex = 3)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ── Widgets ───────────────────────────────────────────────────

class _InputTab extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;
  const _InputTab({required this.label, required this.icon,
      required this.isSelected, required this.onTap});

  @override
  Widget build(BuildContext context) => Expanded(
    child: GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          gradient: isSelected ? AppTheme.primaryGradient : null,
          borderRadius: BorderRadius.circular(11),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 16,
                color: isSelected ? Colors.white : AppTheme.textSecondary),
            const SizedBox(width: 6),
            Text(label,
                style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                    color: isSelected ? Colors.white : AppTheme.textSecondary)),
          ],
        ),
      ),
    ),
  );
}

class _ReportCard extends StatelessWidget {
  final Map<String, dynamic> report;
  const _ReportCard({required this.report});

  IconData _getIconForType(String urgency) {
    if (urgency == 'urgent') return Icons.warning_rounded;
    if (urgency == 'soon') return Icons.info_outline_rounded;
    return Icons.check_circle_outline_rounded;
  }

  Color _getColorForScore(int score) {
    if (score >= 90) return AppTheme.successColor;
    if (score >= 70) return AppTheme.warningColor;
    return AppTheme.errorColor;
  }

  @override
  Widget build(BuildContext context) {
    final urgency = report['urgency'] as String? ?? 'self_care';
    final score = report['score'] as int? ?? 0;
    final color = _getColorForScore(score);
    final icon = _getIconForType(urgency);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.bgCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.borderColor),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: color.withAlpha(30),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(report['title'] as String? ?? 'Report',
                    style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.textPrimary)),
                const SizedBox(height: 3),
                Text(report['explanation'] as String? ?? 'Analysis complete',
                    style: GoogleFonts.inter(
                        fontSize: 12, color: AppTheme.textSecondary),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis),
                const SizedBox(height: 4),
                Text(report['date'] as String? ?? '',
                    style: GoogleFonts.inter(
                        fontSize: 11,
                        color: AppTheme.textSecondary.withAlpha(153))),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: AppTheme.successColor.withAlpha(30),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text('Analyzed',
                style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    color: AppTheme.successColor)),
          ),
        ],
      ),
    );
  }
}

class _HealthTipsBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppTheme.accentColor.withAlpha(51),
            AppTheme.primaryColor.withAlpha(51),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.accentColor.withAlpha(76)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              gradient: AppTheme.primaryGradient,
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Icon(Icons.lightbulb_rounded,
                color: Colors.white, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Daily Health Tip 💡',
                    style: GoogleFonts.inter(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.textPrimary)),
                const SizedBox(height: 4),
                Text(
                  'Drink 8 glasses of water daily. Proper hydration can improve blood test accuracy by 15%.',
                  style: GoogleFonts.inter(
                      fontSize: 12,
                      color: AppTheme.textSecondary,
                      height: 1.5),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isSelected;
  final VoidCallback onTap;
  const _NavItem({required this.icon, required this.label,
      required this.isSelected, required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      decoration: BoxDecoration(
        gradient: isSelected ? AppTheme.primaryGradient : null,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon,
              color: isSelected ? Colors.white : AppTheme.textSecondary,
              size: 22),
          const SizedBox(height: 4),
          Text(label,
              style: GoogleFonts.inter(
                  fontSize: 11,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                  color: isSelected ? Colors.white : AppTheme.textSecondary)),
        ],
      ),
    ),
  );
}
