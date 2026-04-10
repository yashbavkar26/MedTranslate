import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:percent_indicator/percent_indicator.dart';
import '../theme/app_theme.dart';

class ResultScreen extends StatefulWidget {
  const ResultScreen({super.key});

  @override
  State<ResultScreen> createState() => _ResultScreenState();
}

class _ResultScreenState extends State<ResultScreen>
    with TickerProviderStateMixin {
  late AnimationController _fadeCtrl;
  late AnimationController _slideCtrl;
  late Animation<double> _fade;
  late Animation<Offset> _slide;
  int _expandedIndex = 0;

  static const _findings = [
    {
      'name': 'Hemoglobin (Hb)',
      'value': '10.5 g/dL',
      'normalRange': '12.0 – 16.0 g/dL',
      'status': 'low',
      'percent': 0.66,
      'explanation':
          'Your hemoglobin is slightly below the normal range. This may indicate mild anemia, often related to iron deficiency.',
      'recommendation':
          'Consider increasing iron-rich foods like spinach, lentils, and red meat. Follow up with your doctor.',
      'icon': Icons.water_drop_rounded,
      'color': Color(0xFFFF6B6B),
    },
    {
      'name': 'WBC Count',
      'value': '11.2 K/μL',
      'normalRange': '4.0 – 11.0 K/μL',
      'status': 'high',
      'percent': 0.88,
      'explanation':
          'White blood cells are slightly elevated. This can indicate a minor infection or inflammation your body is fighting.',
      'recommendation':
          'Monitor for signs of infection (fever, fatigue). Consult a doctor if elevated for more than 2 weeks.',
      'icon': Icons.bubble_chart_rounded,
      'color': Color(0xFFFF9F43),
    },
    {
      'name': 'Blood Glucose',
      'value': '95 mg/dL',
      'normalRange': '70 – 100 mg/dL',
      'status': 'normal',
      'percent': 0.82,
      'explanation':
          'Your fasting blood glucose is within the normal range — no signs of diabetes or hypoglycemia.',
      'recommendation':
          'Maintain a balanced diet and regular exercise to keep glucose levels stable.',
      'icon': Icons.science_rounded,
      'color': Color(0xFF00C6AE),
    },
    {
      'name': 'Platelets',
      'value': '245 K/μL',
      'normalRange': '150 – 400 K/μL',
      'status': 'normal',
      'percent': 0.65,
      'explanation':
          'Your platelet count is within normal limits. Blood clotting function appears healthy.',
      'recommendation': 'No action needed. Continue routine checkups annually.',
      'icon': Icons.grain_rounded,
      'color': Color(0xFF6C63FF),
    },
  ];

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
  }

  @override
  void dispose() {
    _fadeCtrl.dispose();
    _slideCtrl.dispose();
    super.dispose();
  }

  Color _statusColor(String s) => switch (s) {
        'low' => AppTheme.errorColor,
        'high' => AppTheme.warningColor,
        _ => AppTheme.successColor,
      };

  String _statusLabel(String s) => switch (s) {
        'low' => 'Below Normal',
        'high' => 'Above Normal',
        _ => 'Normal',
      };

  IconData _statusIcon(String s) => switch (s) {
        'low' => Icons.arrow_downward_rounded,
        'high' => Icons.arrow_upward_rounded,
        _ => Icons.check_circle_rounded,
      };

  @override
  Widget build(BuildContext context) {
    final normalCount = _findings.where((f) => f['status'] == 'normal').length;
    final overallScore = normalCount / _findings.length;

    return Scaffold(
      backgroundColor: AppTheme.bgColor,
      body: FadeTransition(
        opacity: _fade,
        child: CustomScrollView(
          slivers: [
            SliverAppBar(
              expandedHeight: 190,
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
                IconButton(
                  icon: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white.withAlpha(25),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.share_rounded,
                        size: 16, color: Colors.white),
                  ),
                  onPressed: () {},
                ),
                const SizedBox(width: 8),
              ],
              flexibleSpace: FlexibleSpaceBar(
                background: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        AppTheme.bgSecondary,
                        AppTheme.primaryColor.withAlpha(76),
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
                          CircularPercentIndicator(
                            radius: 48,
                            lineWidth: 7,
                            percent: overallScore,
                            center: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text('${(overallScore * 100).toInt()}%',
                                    style: GoogleFonts.inter(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w800,
                                        color: AppTheme.textPrimary)),
                                Text('Good',
                                    style: GoogleFonts.inter(
                                        fontSize: 10,
                                        color: AppTheme.successColor)),
                              ],
                            ),
                            progressColor: AppTheme.successColor,
                            backgroundColor: AppTheme.borderColor,
                            circularStrokeCap: CircularStrokeCap.round,
                          ),
                          const SizedBox(width: 20),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text('Blood Test Report',
                                    style: GoogleFonts.inter(
                                        fontSize: 18,
                                        fontWeight: FontWeight.w700,
                                        color: AppTheme.textPrimary)),
                                const SizedBox(height: 4),
                                Text('Analysed on Apr 10, 2026',
                                    style: GoogleFonts.inter(
                                        fontSize: 12,
                                        color: AppTheme.textSecondary)),
                                const SizedBox(height: 8),
                                Row(
                                  children: [
                                    _Chip(
                                        label: '$normalCount Normal',
                                        color: AppTheme.successColor),
                                    const SizedBox(width: 8),
                                    _Chip(
                                        label:
                                            '${_findings.length - normalCount} Attention',
                                        color: AppTheme.warningColor),
                                  ],
                                ),
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
                      // AI Summary
                      Container(
                        padding: const EdgeInsets.all(18),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(colors: [
                            AppTheme.accentColor.withAlpha(38),
                            AppTheme.primaryColor.withAlpha(25),
                          ]),
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                              color: AppTheme.accentColor.withAlpha(76)),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                gradient: AppTheme.primaryGradient,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(Icons.auto_awesome_rounded,
                                  color: Colors.white, size: 18),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('AI Summary',
                                      style: GoogleFonts.inter(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w700,
                                          color: AppTheme.textPrimary)),
                                  const SizedBox(height: 6),
                                  Text(
                                    'Your overall health looks good! Most values are within normal range. Hemoglobin is slightly low — manageable with dietary changes. WBC is marginally elevated, possibly indicating a minor infection. No immediate cause for concern.',
                                    style: GoogleFonts.inter(
                                        fontSize: 13,
                                        color: AppTheme.textSecondary,
                                        height: 1.6),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),
                      Text('Detailed Results',
                          style: GoogleFonts.inter(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.textPrimary)),
                      const SizedBox(height: 14),

                      // Finding cards
                      ...List.generate(_findings.length, (i) {
                        final f = _findings[i];
                        final isExp = _expandedIndex == i;
                        final col = f['color'] as Color;
                        final status = f['status'] as String;
                        return GestureDetector(
                          onTap: () =>
                              setState(() => _expandedIndex = isExp ? -1 : i),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 300),
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: AppTheme.bgCard,
                              borderRadius: BorderRadius.circular(18),
                              border: Border.all(
                                color: isExp
                                    ? col.withAlpha(128)
                                    : AppTheme.borderColor,
                              ),
                              boxShadow: isExp
                                  ? [BoxShadow(
                                      color: col.withAlpha(25),
                                      blurRadius: 20)]
                                  : null,
                            ),
                            child: Column(
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      width: 44,
                                      height: 44,
                                      decoration: BoxDecoration(
                                        color: col.withAlpha(30),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Icon(f['icon'] as IconData,
                                          color: col, size: 22),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(f['name'] as String,
                                              style: GoogleFonts.inter(
                                                  fontSize: 13,
                                                  fontWeight: FontWeight.w600,
                                                  color: AppTheme.textPrimary)),
                                          const SizedBox(height: 2),
                                          Text('Normal: ${f['normalRange']}',
                                              style: GoogleFonts.inter(
                                                  fontSize: 11,
                                                  color: AppTheme.textSecondary)),
                                        ],
                                      ),
                                    ),
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.end,
                                      children: [
                                        Text(f['value'] as String,
                                            style: GoogleFonts.inter(
                                                fontSize: 14,
                                                fontWeight: FontWeight.w700,
                                                color: _statusColor(status))),
                                        const SizedBox(height: 4),
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                              horizontal: 8, vertical: 3),
                                          decoration: BoxDecoration(
                                            color: _statusColor(status)
                                                .withAlpha(30),
                                            borderRadius:
                                                BorderRadius.circular(6),
                                          ),
                                          child: Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              Icon(_statusIcon(status),
                                                  size: 10,
                                                  color: _statusColor(status)),
                                              const SizedBox(width: 3),
                                              Text(_statusLabel(status),
                                                  style: GoogleFonts.inter(
                                                      fontSize: 10,
                                                      fontWeight:
                                                          FontWeight.w500,
                                                      color:
                                                          _statusColor(status))),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                LinearPercentIndicator(
                                  percent: (f['percent'] as double).clamp(0, 1),
                                  lineHeight: 6,
                                  progressColor: _statusColor(status),
                                  backgroundColor: AppTheme.borderColor,
                                  barRadius: const Radius.circular(3),
                                  padding: EdgeInsets.zero,
                                ),
                                if (isExp) ...[
                                  const SizedBox(height: 16),
                                  const Divider(
                                      color: AppTheme.borderColor, height: 1),
                                  const SizedBox(height: 16),
                                  _InfoBlock(
                                      icon: Icons.info_outline_rounded,
                                      title: 'What does this mean?',
                                      content: f['explanation'] as String,
                                      color: AppTheme.infoColor),
                                  const SizedBox(height: 12),
                                  _InfoBlock(
                                      icon: Icons.recommend_rounded,
                                      title: 'Recommendation',
                                      content: f['recommendation'] as String,
                                      color: AppTheme.successColor),
                                ],
                              ],
                            ),
                          ),
                        );
                      }),

                      const SizedBox(height: 20),
                      // Disclaimer
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

class _Chip extends StatelessWidget {
  final String label;
  final Color color;
  const _Chip({required this.label, required this.color});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
    decoration: BoxDecoration(
      color: color.withAlpha(30),
      borderRadius: BorderRadius.circular(8),
    ),
    child: Text(label,
        style: GoogleFonts.inter(
            fontSize: 11, fontWeight: FontWeight.w500, color: color)),
  );
}

class _InfoBlock extends StatelessWidget {
  final IconData icon;
  final String title;
  final String content;
  final Color color;
  const _InfoBlock({required this.icon, required this.title,
      required this.content, required this.color});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: color.withAlpha(20),
      borderRadius: BorderRadius.circular(12),
    ),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: color, size: 16),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title,
                  style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: color)),
              const SizedBox(height: 4),
              Text(content,
                  style: GoogleFonts.inter(
                      fontSize: 12,
                      color: AppTheme.textSecondary,
                      height: 1.5)),
            ],
          ),
        ),
      ],
    ),
  );
}
