import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';

class HistoryScreen extends StatelessWidget {
  const HistoryScreen({super.key});

  static const _reports = [
    {'title': 'Blood Test Report', 'date': 'Apr 8, 2026', 'type': 'Blood Test',
      'score': 75, 'icon': Icons.bloodtype_rounded, 'color': Color(0xFFFF6B6B),
      'tags': ['Hemoglobin', 'WBC', 'Platelets']},
    {'title': 'MRI Scan Report', 'date': 'Mar 25, 2026', 'type': 'Radiology',
      'score': 90, 'icon': Icons.document_scanner_rounded, 'color': Color(0xFF6C63FF),
      'tags': ['Spine', 'L4-L5', 'Disc']},
    {'title': 'Thyroid Panel', 'date': 'Mar 10, 2026', 'type': 'Hormone Test',
      'score': 95, 'icon': Icons.science_rounded, 'color': Color(0xFF00C6AE),
      'tags': ['TSH', 'T3', 'T4']},
    {'title': 'Liver Function Test', 'date': 'Feb 20, 2026', 'type': 'Metabolic',
      'score': 82, 'icon': Icons.monitor_heart_rounded, 'color': Color(0xFFFF9F43),
      'tags': ['ALT', 'AST', 'Bilirubin']},
    {'title': 'Chest X-Ray', 'date': 'Jan 15, 2026', 'type': 'Radiology',
      'score': 98, 'icon': Icons.coronavirus_rounded, 'color': Color(0xFF58A6FF),
      'tags': ['Lungs', 'Cardiac', 'Ribs']},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgColor,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 20, 24, 0),
              child: Row(
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Report History',
                          style: GoogleFonts.inter(
                              fontSize: 24,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.textPrimary)),
                      Text('${_reports.length} reports analysed',
                          style: GoogleFonts.inter(
                              fontSize: 13, color: AppTheme.textSecondary)),
                    ],
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppTheme.bgCard,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.borderColor),
                    ),
                    child: const Icon(Icons.filter_list_rounded,
                        color: AppTheme.textSecondary, size: 20),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(
                  color: AppTheme.bgCard,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppTheme.borderColor),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.search_rounded,
                        color: AppTheme.textSecondary, size: 20),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextField(
                        style: GoogleFonts.inter(
                            color: AppTheme.textPrimary, fontSize: 14),
                        decoration: InputDecoration(
                          hintText: 'Search reports...',
                          hintStyle: GoogleFonts.inter(
                              color: AppTheme.textSecondary, fontSize: 14),
                          border: InputBorder.none,
                          contentPadding:
                              const EdgeInsets.symmetric(vertical: 14),
                          filled: false,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                itemCount: _reports.length,
                itemBuilder: (context, i) {
                  final r = _reports[i];
                  final score = r['score'] as int;
                  final scoreColor = score >= 90
                      ? AppTheme.successColor
                      : score >= 70
                          ? AppTheme.warningColor
                          : AppTheme.errorColor;
                  final col = r['color'] as Color;
                  return Container(
                    margin: const EdgeInsets.only(bottom: 14),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppTheme.bgCard,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: AppTheme.borderColor),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 52,
                          height: 52,
                          decoration: BoxDecoration(
                            color: col.withAlpha(30),
                            borderRadius: BorderRadius.circular(15),
                          ),
                          child: Icon(r['icon'] as IconData,
                              color: col, size: 26),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(r['title'] as String,
                                  style: GoogleFonts.inter(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                      color: AppTheme.textPrimary)),
                              const SizedBox(height: 4),
                              Text(r['type'] as String,
                                  style: GoogleFonts.inter(
                                      fontSize: 11,
                                      color: AppTheme.textSecondary)),
                              const SizedBox(height: 8),
                              Wrap(
                                spacing: 6,
                                children: (r['tags'] as List<String>)
                                    .map((tag) => Container(
                                          padding: const EdgeInsets.symmetric(
                                              horizontal: 8, vertical: 3),
                                          decoration: BoxDecoration(
                                            color: AppTheme.bgCardLight,
                                            borderRadius:
                                                BorderRadius.circular(6),
                                            border: Border.all(
                                                color: AppTheme.borderColor),
                                          ),
                                          child: Text(tag,
                                              style: GoogleFonts.inter(
                                                  fontSize: 10,
                                                  color:
                                                      AppTheme.textSecondary)),
                                        ))
                                    .toList(),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 10),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Container(
                              width: 44,
                              height: 44,
                              decoration: BoxDecoration(
                                color: scoreColor.withAlpha(25),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                    color: scoreColor.withAlpha(76)),
                              ),
                              child: Center(
                                child: Text('$score',
                                    style: GoogleFonts.inter(
                                        fontSize: 15,
                                        fontWeight: FontWeight.w700,
                                        color: scoreColor)),
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(r['date'] as String,
                                style: GoogleFonts.inter(
                                    fontSize: 10,
                                    color: AppTheme.textSecondary)),
                          ],
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
